// @ts-nocheck - Disable TypeScript checking for this file due to Anchor-generated type mismatches

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";

// Test suite focusing on the product registration function specifically
describe("sodap product registration", () => {
  // Initialize provider and program instances
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

  // Test registering a product using the most basic form
  it("registers a product with minimal accounts", async () => {
    // Use provider's wallet as payer
    const payer = provider.wallet.publicKey;
    
    // Fund payer account
    await requestAirdrop(payer);

    // Create a product ID and store ID
    const productId = Keypair.generate().publicKey;
    const storeId = Keypair.generate().publicKey;
    
    console.log("Product ID:", productId.toString());
    console.log("Store ID:", storeId.toString());
    
    // Try the most minimal version of register_product that we found in lib.rs
    try {
      const productRegTx = await program.methods
        .registerProduct(
          productId,
          storeId,
          "Test Product",
          "A test product for testing",
          "https://example.com/image.png",
          new BN(100),  // price
          new BN(10),   // inventory (optional)
          []            // attributes (empty array)
        )
        .accounts({
          payer: payer,
          system_program: SystemProgram.programId
        })
        .rpc();
      
      console.log("Product registered successfully:", productRegTx);
      
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  });
});
