// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import { assert } from "chai";

describe("SODAP MVP Tests", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Test accounts
  const storeOwner = Keypair.generate();
  const customer = provider.wallet.payer;

  // Store PDAs and data
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  let productPda: PublicKey;

  // Helper function to request an airdrop
  async function requestAirdrop(publicKey: PublicKey) {
    const signature = await provider.connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  }

  before(async () => {
    // Fund test accounts
    await requestAirdrop(storeOwner.publicKey);

    // Find PDAs
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
  });

  it("initializes the program", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    assert(tx, "Failed to initialize program");
  });

  it("registers a store", async () => {
    // Basic store config
    const storeTx = await program.methods
      .registerStore(
        "MVP Test Store",
        "A test store for MVP functionality",
        "https://example.com/logo.png",
        {
          pointsPerDollar: new BN(10),
          minimumPurchase: new BN(100),
          rewardPercentage: new BN(5),
          isActive: true,
        }
      )
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    assert(storeTx, "Failed to register store");

    // Verify store data
    const storeAccount = await program.account.store.fetch(storePda);
    assert.equal(storeAccount.name, "MVP Test Store");
    assert.equal(
      storeAccount.owner.toString(),
      storeOwner.publicKey.toString()
    );
    assert.isTrue(storeAccount.isActive);
  });

  it("registers a product", async () => {
    // Generate product ID
    const productId = Keypair.generate();

    // Find product PDA
    [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), productId.publicKey.toBuffer()],
      program.programId
    );

    const productTx = await program.methods
      .registerProduct(
        productId.publicKey,
        "Test Product",
        "A simple test product",
        "https://example.com/product.png",
        new BN(0.5 * LAMPORTS_PER_SOL), // 0.5 SOL price
        new BN(10), // 10 units in stock
        [] // No attributes for MVP
      )
      .accounts({
        store: storePda,
        product: productPda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    assert(productTx, "Failed to register product");

    // Verify product data
    const productAccount = await program.account.product.fetch(productPda);
    assert.equal(productAccount.name, "Test Product");
    assert.equal(productAccount.price.toNumber(), 0.5 * LAMPORTS_PER_SOL);
    assert.equal(productAccount.stock.toNumber(), 10);
  });

  it("completes a basic purchase", async () => {
    const purchaseAmount = new BN(0.5 * LAMPORTS_PER_SOL);
    const initialEscrowBalance = await provider.connection.getBalance(
      escrowPda
    );

    // Add funds to escrow
    await provider.connection.sendTransaction(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: customer.publicKey,
          toPubkey: escrowPda,
          lamports: purchaseAmount.toNumber(),
        })
      ),
      [customer]
    );

    // Verify escrow received funds
    const newEscrowBalance = await provider.connection.getBalance(escrowPda);
    assert.equal(
      newEscrowBalance - initialEscrowBalance,
      purchaseAmount.toNumber(),
      "Escrow balance did not increase correctly"
    );

    // Release funds to store owner
    const initialOwnerBalance = await provider.connection.getBalance(
      storeOwner.publicKey
    );

    await program.methods
      .releaseEscrow(purchaseAmount)
      .accounts({
        store: storePda,
        escrowAccount: escrowPda,
        storeOwner: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify store owner received funds
    const finalOwnerBalance = await provider.connection.getBalance(
      storeOwner.publicKey
    );
    assert.isAbove(
      finalOwnerBalance,
      initialOwnerBalance,
      "Store owner balance did not increase"
    );
  });
});
