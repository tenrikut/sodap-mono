import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";

describe("Escrow Operations Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  const storeOwner = Keypair.generate();
  const customer = Keypair.generate();
  let storePda: PublicKey;
  let escrowPda: PublicKey;

  before(async () => {
    // Fund accounts
    const signature1 = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature1);

    const signature2 = await provider.connection.requestAirdrop(
      customer.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature2);

    // Create store
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );

    await program.methods
      .registerStore("Test Store", "Test Description", "logo.png", {
        pointsPerSol: new anchor.BN(100),
        minAmountForPoints: new anchor.BN(1000),
        pointsValidity: new anchor.BN(365 * 24 * 60 * 60), // 1 year
      })
      .accounts({
        store: storePda,
        escrow: escrowPda,
        authority: storeOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Transfer some SOL to escrow for testing
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: customer.publicKey,
        toPubkey: escrowPda,
        lamports: 0.5 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(tx, [customer]);
  });

  it("Should release funds from escrow to store owner", async () => {
    const initialOwnerBalance = await provider.connection.getBalance(
      storeOwner.publicKey
    );
    const releaseAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .releaseEscrow(releaseAmount)
      .accounts({
        store: storePda,
        escrow: escrowPda,
        owner: storeOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    const finalOwnerBalance = await provider.connection.getBalance(
      storeOwner.publicKey
    );
    assert.approximately(
      finalOwnerBalance - initialOwnerBalance,
      0.1 * anchor.web3.LAMPORTS_PER_SOL,
      0.01 * anchor.web3.LAMPORTS_PER_SOL // Allow for transaction fees
    );
  });

  it("Should refund funds from escrow to customer", async () => {
    const initialCustomerBalance = await provider.connection.getBalance(
      customer.publicKey
    );
    const refundAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .refundEscrow(refundAmount)
      .accounts({
        store: storePda,
        escrow: escrowPda,
        buyer: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([customer])
      .rpc();

    const finalCustomerBalance = await provider.connection.getBalance(
      customer.publicKey
    );
    assert.approximately(
      finalCustomerBalance - initialCustomerBalance,
      0.1 * anchor.web3.LAMPORTS_PER_SOL,
      0.01 * anchor.web3.LAMPORTS_PER_SOL // Allow for transaction fees
    );
  });

  it("Should not allow unauthorized release", async () => {
    const releaseAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
    const unauthorizedUser = Keypair.generate();

    try {
      await program.methods
        .releaseEscrow(releaseAmount)
        .accounts({
          store: storePda,
          escrow: escrowPda,
          owner: unauthorizedUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([unauthorizedUser])
        .rpc();
      assert.fail("Should not allow unauthorized release");
    } catch (error) {
      assert.include(error.message, "Error");
    }
  });

  it("Should not allow release of more than escrow balance", async () => {
    const tooLargeAmount = new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL);

    try {
      await program.methods
        .releaseEscrow(tooLargeAmount)
        .accounts({
          store: storePda,
          escrow: escrowPda,
          owner: storeOwner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Should not allow release of more than escrow balance");
    } catch (error) {
      assert.include(error.message, "Error");
    }
  });
});
