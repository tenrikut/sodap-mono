// @ts-nocheck - Disable TypeScript checking for this file due to Anchor-generated type mismatches

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";

// Simple test for Solana Pay checkout flow
describe("sodap-solana-pay-checkout", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  const wallet = provider.wallet;

  // Helper function to request an airdrop to a public key
  async function requestAirdrop(publicKey: PublicKey, amount = 10_000_000_000) {
    try {
      const signature = await provider.connection.requestAirdrop(
        publicKey,
        amount
      );
      await provider.connection.confirmTransaction(signature, "confirmed");
      // Add a small delay to ensure the airdrop is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Airdropped ${amount} lamports to ${publicKey.toString()}`);
    } catch (err) {
      console.error("Airdrop failed:", err);
    }
  }

  // Helper function to generate unique product UUID
  function generateUniqueProductUuid() {
    // Generate a standard UUID
    const uuid = uuidv4();
    // Convert to bytes - this is critical to ensure it's exactly 16 bytes
    const bytes = new Uint8Array(16);

    // Parse the UUID string into bytes
    const parts = uuid.replace(/-/g, "").match(/.{2}/g) || [];
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(parts[i], 16);
    }

    return bytes;
  }

  // Test the program initialization
  it("Initialize the program", async () => {
    // Fund the wallet
    await requestAirdrop(wallet.publicKey);
    
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          payer: wallet.publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc();
      console.log("Program initialized:", tx);
    } catch (err) {
      // If already initialized, that's fine
      console.log("Program initialization error (might be already initialized):", err.message);
    }
  });

  // Test the Solana Pay checkout flow focusing only on the core payment functionality
  it("completes a solana pay checkout flow", async () => {
    // Fund the wallet
    await requestAirdrop(wallet.publicKey);
    
    // Find the store PDA
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Store PDA:", storePda.toString());
    
    // Register a store (or use existing)
    try {
      await program.methods
        .registerStore(
          wallet.publicKey,
          "Solana Pay Test Store",
          "A store to test Solana Pay checkout",
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
          owner: wallet.publicKey,
          payer: wallet.publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc();
      console.log("Store registered successfully");
    } catch (err) {
      // If store already exists, that's fine
      console.log("Store registration error (might already exist):", err.message);
    }
    
    // Create a product for purchase
    const productUuidBytes = generateUniqueProductUuid();
    const productUuidArray = Array.from(productUuidBytes);
    
    // Find product PDA
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), storePda.toBuffer(), Buffer.from(productUuidBytes)],
      program.programId
    );
    
    console.log("Product PDA:", productPda.toString());

    // Create a token account for the wallet
    let tokenAccount: PublicKey;
    let mintPubkey: PublicKey;
    
    try {
      // Create a new token (mint)
      const token = await Token.createMint(
        provider.connection,
        wallet.payer, // payer
        wallet.publicKey, // mint authority
        wallet.publicKey, // freeze authority (optional)
        0, // decimals
        TOKEN_PROGRAM_ID
      );
      console.log("Created mint with address:", token.publicKey.toString());
      
      // Store the mint's public key
      mintPubkey = token.publicKey;
      
      // Create a token account for the user
      const userTokenAccount = await token.createAccount(wallet.publicKey);
      tokenAccount = userTokenAccount;
      console.log("Created token account:", tokenAccount.toString());
    } catch (err) {
      console.error("Error creating token accounts:", err);
      throw err;
    }
    
    // Register the product
    try {
      await program.methods
        .registerProduct(
          productUuidArray,
          new anchor.BN(500), // price: 500 lamports
          new anchor.BN(10),  // stock: 10 items
          { none: {} },       // non-tokenized for simplicity
          "https://example.com/product"
        )
        .accounts({
          product: productPda,
          store: wallet.publicKey, 
          store_account: storePda,
          mint: mintPubkey,
          tokenAccount: tokenAccount,
          token_program: TOKEN_PROGRAM_ID,
          associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          payer: wallet.publicKey, // Add payer account
        })
        .rpc();
      console.log("Product registered successfully");
      
      // Verify product was created
      const product = await program.account.product.fetch(productPda);
      assert.equal(product.price.toNumber(), 500);
      assert.equal(product.stock.toNumber(), 10);
      console.log("Product verified:", product);
    } catch (err) {
      console.error("Error registering product:", err);
      throw err;
    }
    
    // Find the cart PDA
    const [cartPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("cart"),
        wallet.publicKey.toBuffer(),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    console.log("Cart PDA:", cartPda.toString());
    
    // Find the escrow PDA
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
    
    console.log("Escrow PDA:", escrowPda.toString());
    
    try {
      // Wallet balance before purchase
      const balanceBefore = await provider.connection.getBalance(wallet.publicKey);
      console.log("Wallet balance before purchase:", balanceBefore);
      
      // Create receipt PDA
      const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("purchase"),
          storePda.toBuffer(),
          wallet.publicKey.toBuffer(),
        ],
        program.programId
      );
      
      console.log("Receipt PDA:", receiptPda.toString());
      
      // Purchase the product (Solana Pay checkout flow)
      await program.methods
        .purchaseCart(
          [productUuidArray],  // Product UUIDs
          [new BN(1)],         // Quantities (buying 1 of the product)
          new BN(500),         // Total amount paid - must match product price * quantity
          new BN(0),           // Gas fee
          { success: {} }      // Transaction status
        )
        .accounts({
          buyer: wallet.publicKey,
          store: storePda,
          receipt: receiptPda,
          store_owner: wallet.publicKey,
          escrow_account: escrowPda,
          system_program: SystemProgram.programId,
          payer: wallet.publicKey, // Add payer account
        })
        .remainingAccounts([
          { pubkey: productPda, isWritable: true, isSigner: false }
        ])
        .rpc();
      
      console.log("Purchase completed successfully");
      
      // Verify product stock was updated
      const updatedProduct = await program.account.product.fetch(productPda);
      assert.equal(updatedProduct.stock.toNumber(), 9, "Product stock should be reduced");
      
      // Check escrow balance (payment should be in escrow)
      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.equal(escrowAccount.balance.toNumber(), 500, "Payment should be held in escrow");
      
      // Release the escrow to the store owner
      await program.methods
        .releaseEscrow(new BN(500))
        .accounts({
          store: wallet.publicKey,
          store_account: storePda,
          store_owner: wallet.publicKey,
          escrow_account: escrowPda,
          system_program: SystemProgram.programId,
          payer: wallet.publicKey,
        })
        .rpc();
      
      console.log("Escrow released to store owner");
      
      // Verify escrow should be empty now
      const updatedEscrow = await program.account.escrow.fetch(escrowPda);
      assert.equal(updatedEscrow.balance.toNumber(), 0, "Escrow should be empty after release");
      
      // Wallet balance after purchase and release
      const balanceAfter = await provider.connection.getBalance(wallet.publicKey);
      console.log("Wallet balance after full process:", balanceAfter);
    } catch (err) {
      console.error("Error in purchase flow:", err);
      throw err;
    }
  });
});
