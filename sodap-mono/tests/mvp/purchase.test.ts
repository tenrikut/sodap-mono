import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";
import {
  findProductPDA,
  findStorePDA,
  findEscrowPDA,
  findLoyaltyMintPDA,
  findReceiptPDA,
} from "../../utils/pda-helpers";
import { v4 as uuidv4 } from "uuid";

function uuidToBytes(uuid: string): number[] {
  const hex = uuid.replace(/-/g, "");
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

describe("SODAP Purchase Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  let storeOwner: Keypair;
  let buyer: Keypair;
  let storePDA: PublicKey;
  let escrowPDA: PublicKey;
  let productPDA: PublicKey;
  let loyaltyMintPDA: PublicKey;
  let receiptPDA: PublicKey;
  let productUuid: number[];

  before(async () => {
    storeOwner = Keypair.generate();
    buyer = Keypair.generate();

    // Airdrop SOL to store owner and buyer
    let signature = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    signature = await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Setup store
    [storePDA] = findStorePDA(program.programId, storeOwner.publicKey);
    [escrowPDA] = findEscrowPDA(program.programId, storePDA);

    // Register store
    await program.methods
      .registerStore(
        "Test Store",
        "Test Description",
        "https://example.com/logo.png",
        {
          pointsPerDollar: new anchor.BN(10),
          minimumPurchase: new anchor.BN(100),
          rewardPercentage: new anchor.BN(5),
          isActive: true,
        }
      )
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Setup escrow
    await program.methods
      .storeEscrow()
      .accounts({
        escrowAccount: escrowPDA,
        store: storePDA,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Register product
    productUuid = uuidToBytes(uuidv4());
    [productPDA] = findProductPDA(
      program.programId,
      storePDA,
      Buffer.from(productUuid)
    );

    await program.methods
      .registerProduct(
        productUuid,
        new anchor.BN(1_000_000), // 1 SOL
        new anchor.BN(100), // 100 units
        { physical: {} },
        "https://example.com/product/1"
      )
      .accounts({
        store: storePDA,
        product: productPDA,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Setup loyalty program
    [loyaltyMintPDA] = findLoyaltyMintPDA(program.programId, storePDA);
    const loyaltyMint = Keypair.generate();
    await program.methods
      .initializeLoyaltyMint(
        new anchor.BN(1000), // 1000 points per SOL
        new anchor.BN(100), // 100 points = 1 SOL
        false
      )
      .accounts({
        store: storePDA,
        loyaltyMintAccount: loyaltyMintPDA,
        tokenMint: loyaltyMint.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([storeOwner, loyaltyMint])
      .rpc();
  });

  it("should process a purchase and hold funds in escrow", async () => {
    [receiptPDA] = findReceiptPDA(program.programId, storePDA, buyer.publicKey);

    const beforeEscrowBalance = await provider.connection.getBalance(escrowPDA);

    await program.methods
      .purchaseCart([productPDA], [new anchor.BN(1)], new anchor.BN(1_000_000))
      .accounts({
        store: storePDA,
        receipt: receiptPDA,
        buyer: buyer.publicKey,
        storeOwner: storeOwner.publicKey,
        escrowAccount: escrowPDA,
        loyaltyMintInfo: loyaltyMintPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    // Verify escrow balance increased
    const afterEscrowBalance = await provider.connection.getBalance(escrowPDA);
    assert.equal(afterEscrowBalance - beforeEscrowBalance, 1_000_000);

    // Verify receipt
    const receipt = await program.account.purchase.fetch(receiptPDA);
    assert.equal(receipt.totalPaid.toNumber(), 1_000_000);
    assert.equal(receipt.store.toString(), storePDA.toString());
    assert.equal(receipt.buyer.toString(), buyer.publicKey.toString());
  });

  it("should release funds from escrow to store owner", async () => {
    const beforeOwnerBalance = await provider.connection.getBalance(
      storeOwner.publicKey
    );
    const escrowBalance = await provider.connection.getBalance(escrowPDA);

    await program.methods
      .releaseEscrow(new anchor.BN(1_000_000))
      .accounts({
        store: storePDA,
        escrowAccount: escrowPDA,
        storeOwner: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify escrow is empty and owner received funds
    const afterOwnerBalance = await provider.connection.getBalance(
      storeOwner.publicKey
    );
    assert.approximately(
      afterOwnerBalance - beforeOwnerBalance,
      1_000_000,
      1000 // Allow small difference for gas fees
    );

    const afterEscrowBalance = await provider.connection.getBalance(escrowPDA);
    assert.equal(afterEscrowBalance, escrowBalance - 1_000_000);
  });

  it("should fail purchase with insufficient funds", async () => {
    const poorBuyer = Keypair.generate();
    // Don't airdrop any SOL to this buyer

    [receiptPDA] = findReceiptPDA(
      program.programId,
      storePDA,
      poorBuyer.publicKey
    );

    try {
      await program.methods
        .purchaseCart(
          [productPDA],
          [new anchor.BN(1)],
          new anchor.BN(1_000_000)
        )
        .accounts({
          store: storePDA,
          receipt: receiptPDA,
          buyer: poorBuyer.publicKey,
          storeOwner: storeOwner.publicKey,
          escrowAccount: escrowPDA,
          loyaltyMintInfo: loyaltyMintPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([poorBuyer])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err) {
      assert.include(err.toString(), "insufficient funds");
    }
  });

  it("should fail purchase of out-of-stock product", async () => {
    // First update product stock to 0
    await program.methods
      .updateProduct(productUuid, null, new anchor.BN(0), null)
      .accounts({
        store: storePDA,
        product: productPDA,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    try {
      await program.methods
        .purchaseCart(
          [productPDA],
          [new anchor.BN(1)],
          new anchor.BN(1_000_000)
        )
        .accounts({
          store: storePDA,
          receipt: receiptPDA,
          buyer: buyer.publicKey,
          storeOwner: storeOwner.publicKey,
          escrowAccount: escrowPDA,
          loyaltyMintInfo: loyaltyMintPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err) {
      assert.include(err.toString(), "Product out of stock");
    }
  });
});
