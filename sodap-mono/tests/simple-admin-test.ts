// @ts-nocheck - Disable TypeScript checking for this file due to Anchor-generated type mismatches

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";

// Main test suite for the Sodap admin functionality - simplified version
describe("sodap admin simplified test", () => {
  // Initialize provider and program instances - using the method from basic-test.ts
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

  // Test initialization of the program (already works in basic-test.ts)
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

  // Test adding a store admin
  it("registers a store and adds an admin", async () => {
    // Use the provider's wallet as the owner
    const owner = provider.wallet.payer;
    const storeId = owner.publicKey;
    
    // Create an admin keypair for testing
    const admin = Keypair.generate();
    
    // Fund accounts with SOL
    await requestAirdrop(owner.publicKey);
    await requestAirdrop(admin.publicKey);

    // Find PDA for store account
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeId.toBuffer()],
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
      
      // Verify store was created
      const storeAccount = await program.account.store.fetch(storePda);
      console.log("Store account verified:", storeAccount.name);
      console.log("Store owner:", storeAccount.owner.toString());
      console.log("Expected owner (authority):", owner.publicKey.toString());
      console.log("Are they equal?", storeAccount.owner.equals(owner.publicKey));
      
      // Add admin with manager role
      // Log out the instruction to debug the accounts needed
      console.log("Program ID:", program.programId.toString());
      console.log("addStoreAdmin IDL:", program.idl.instructions.find(i => i.name === 'addStoreAdmin'));
      
      try {
        const adminTx = await program.methods
          .addStoreAdmin(storeId, admin.publicKey, { manager: {} }) // Adding storeId as first parameter
          .accounts({
            store: storePda,
            authority: owner.publicKey,
            payer: provider.wallet.publicKey,
            system_program: SystemProgram.programId
          })
          .rpc();
          
        console.log("Admin added successfully:", adminTx);
      } catch (error) {
        console.error("Failed to add admin:", error);
        // Try with explicitly specified accounts
        const ix = await program.methods
          .addStoreAdmin(storeId, admin.publicKey, { manager: {} })
          .accounts({
            store: storePda,
            authority: owner.publicKey,
            payer: provider.wallet.publicKey,
            system_program: SystemProgram.programId
          })
          .instruction();
          
        console.log("Instruction accounts:", ix.keys.map(k => ({ pubkey: k.pubkey.toString(), isSigner: k.isSigner, isWritable: k.isWritable })));
        throw error;
      }
      
      // Verify admin was added
      const updatedStore = await program.account.store.fetch(storePda);
      assert.equal(updatedStore.adminRoles.length, 2);
      assert.equal(
        updatedStore.adminRoles[1].adminPubkey.toString(),
        admin.publicKey.toString()
      );
      
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  });
});
