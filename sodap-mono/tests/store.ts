import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("sodap store test", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Helper function to request an airdrop
  async function requestAirdrop(publicKey: PublicKey, amount = 10_000_000_000) {
    const signature = await provider.connection.requestAirdrop(publicKey, amount);
    await provider.connection.confirmTransaction(signature, "confirmed");
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }

  // Test store operations
  it("registers and verifies a store", async () => {
    // Use the provider's wallet as the owner
    const owner = provider.wallet.payer;
    
    // Fund account with SOL
    await requestAirdrop(owner.publicKey);

    // Find store PDA
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), owner.publicKey.toBuffer()],
      program.programId
    );

    // Find escrow PDA
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );

    console.log("Store PDA:", storePda.toString());
    console.log("Escrow PDA:", escrowPda.toString());
    console.log("Owner:", owner.publicKey.toString());

    try {
      // Register the store
      const storeRegTx = await program.methods
        .registerStore(
          "Test Store",
          "A test store for testing",
          "https://example.com/logo.png"
        )
        .accounts({
          payer: owner.publicKey,
          systemProgram: SystemProgram.programId,
          storeAccount: storePda,
          escrowAccount: escrowPda,
        })
        .rpc();
      
      console.log("Store registered successfully:", storeRegTx);
      
      // Verify store was created correctly
      const storeAccount = await program.account.store.fetch(storePda);
      
      // Verify basic store data
      assert.equal(storeAccount.name, "Test Store", "Store name should match");
      assert.equal(storeAccount.description, "A test store for testing", "Store description should match");
      assert.equal(storeAccount.logoUri, "https://example.com/logo.png", "Store logo URI should match");
      assert.ok(storeAccount.owner.equals(owner.publicKey), "Store owner should match authority");
      assert.ok(storeAccount.isActive, "Store should be active");
      assert.equal(storeAccount.revenue.toNumber(), 0, "Initial revenue should be 0");
      assert.equal(storeAccount.adminRoles.length, 0, "Should start with no admin roles");
      
      // Test updating store metadata
      const updateTx = await program.methods
        .updateStore(
          storePda,
          "Updated Store Name",
          "Updated description",
          "https://example.com/new-logo.png"
        )
        .accounts({
          storeAccount: storePda,
          storeOwner: owner.publicKey,
        })
        .rpc();
      
      console.log("Store updated successfully:", updateTx);
      
      // Verify updates
      const updatedStore = await program.account.store.fetch(storePda);
      assert.equal(updatedStore.name, "Updated Store Name", "Updated store name should match");
      assert.equal(updatedStore.description, "Updated description", "Updated description should match");
      assert.equal(updatedStore.logoUri, "https://example.com/new-logo.png", "Updated logo URI should match");
      
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  });
});

