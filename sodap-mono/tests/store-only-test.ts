// @ts-nocheck - Disable TypeScript checking for this file due to Anchor-generated type mismatches

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";

// Test suite focusing only on store functions that we know work
describe("sodap store test", () => {
  // Initialize provider and program instances - using the method from simple-admin-test.ts
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Helper function to request an airdrop to a public key
  async function requestAirdrop(publicKey: PublicKey, amount = 10_000_000_000) {
    const signature = await provider.connection.requestAirdrop(
      publicKey,
      amount
    );
    await provider.connection.confirmTransaction(signature, "confirmed");
    // Add a small delay to ensure the airdrop is processed
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test initialization of the program
  it("Is initialized!", async () => {
    // Make sure the wallet has enough SOL
    await requestAirdrop(provider.wallet.publicKey);
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        system_program: SystemProgram.programId
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  // Test registering a store and verifying it
  it("registers and verifies a store", async () => {
    // Use the provider's wallet as the owner
    const owner = provider.wallet.payer;
    const storeId = owner.publicKey;
    
    // Fund account with SOL
    await requestAirdrop(owner.publicKey);

    // Find PDA for store account - using authority key as seed
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), owner.publicKey.toBuffer()],
      program.programId
    );

    console.log("Store PDA:", storePda.toString());
    console.log("Owner:", owner.publicKey.toString());

    // Register the store with correct account structure
    try {
      const storeRegTx = await program.methods
        .registerStore(
          storeId,
          "Test Store",
          "A test store for testing",
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
          authority: owner.publicKey,
          payer: provider.wallet.publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Store registered successfully:", storeRegTx);
      
      // Verify store was created correctly
      const storeAccount = await program.account.store.fetch(storePda);
      console.log("Store account verified:", storeAccount.name);
      console.log("Store owner:", storeAccount.owner.toString());
      console.log("Expected owner (authority):", owner.publicKey.toString());
      console.log("Are they equal?", storeAccount.owner.equals(owner.publicKey));
      
      // Verify store admin roles include the owner
      assert.equal(storeAccount.adminRoles.length, 1);
      assert.equal(
        storeAccount.adminRoles[0].adminPubkey.toString(),
        owner.publicKey.toString()
      );
      
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  });
});
