// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Sodap } from "../../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import { assert } from "chai";

describe("Store Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Sodap as Program<Sodap>;

  const storeOwner = Keypair.generate();
  let storePda: PublicKey;

  before(async () => {
    // Fund test account
    const sig = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Find store PDA
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );
  });

  it("creates a basic store", async () => {
    // Simple store config
    const tx = await program.methods
      .registerStore("Test Store", "Basic Store", "https://test.com/logo.png", {
        pointsPerDollar: new BN(10),
        minimumPurchase: new BN(100),
        rewardPercentage: new BN(5),
        isActive: true,
      })
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    const store = await program.account.store.fetch(storePda);
    assert.equal(store.name, "Test Store");
  });

  it("updates store settings", async () => {
    const tx = await program.methods
      .updateStore(
        "Updated Store",
        "Updated Store",
        "https://test.com/new-logo.png",
        {
          pointsPerDollar: new BN(20),
          minimumPurchase: new BN(200),
          rewardPercentage: new BN(10),
          isActive: true,
        }
      )
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    const store = await program.account.store.fetch(storePda);
    assert.equal(store.name, "Updated Store");
  });
});
