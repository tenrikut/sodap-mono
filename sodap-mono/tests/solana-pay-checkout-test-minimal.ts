// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
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
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";

// Test for core Solana Pay checkout functionality
describe("solana-pay-checkout-minimal-test", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  const wallet = provider.wallet;

  // Test state
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  let productPda: PublicKey;
  let productUuidBytes: Uint8Array;
  let receiptPda: PublicKey;

  // Helper function to generate product UUID
  function generateUniqueProductUuid() {
    const uuid = uuidv4();
    const bytes = new Uint8Array(16);
    const parts = uuid.replace(/-/g, "").match(/.{2}/g) || [];
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(parts[i], 16);
    }
    return bytes;
  }

  // Helper function to request an airdrop
  async function requestAirdrop(publicKey: PublicKey, amount = 1_000_000_000) {
    try {
      const signature = await provider.connection.requestAirdrop(
        publicKey,
        amount
      );
      await provider.connection.confirmTransaction(signature, "confirmed");
      console.log(`Airdropped ${amount} lamports to ${publicKey.toString()}`);
    } catch (err) {
      console.error("Airdrop failed:", err);
    }
  }

  // Setup: Initialize program and create store
  before(async function() {
    // Fund the wallet
    await requestAirdrop(wallet.publicKey);
    
    // Find store PDA
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Store PDA:", storePda.toString());
    
    // Find escrow PDA
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
    
    console.log("Escrow PDA:", escrowPda.toString());
    
    // Initialize program (only if needed)
    try {
      await program.methods
        .initialize()
        .accounts({
          payer: wallet.publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc();
      console.log("Program initialized");
    } catch (err) {
      console.log("Program initialization skipped (might be already initialized)");
    }
    
    // Register store or use existing
    try {
      await program.methods
        .registerStore(
          wallet.publicKey,
          "Solana Pay Test Store",
          "A store for testing Solana Pay integration",
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
      console.log("Store registration skipped (might already exist):", err.message);
    }
  });

  it("registers a product for Solana Pay checkout", async () => {
    // Generate unique product for testing
    productUuidBytes = generateUniqueProductUuid();
    const productUuidArray = Array.from(productUuidBytes);
    
    // Find product PDA
    [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), storePda.toBuffer(), Buffer.from(productUuidBytes)],
      program.programId
    );
    
    console.log("Product PDA:", productPda.toString());
    
    // Create token for product
    const token = await Token.createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      0,
      TOKEN_PROGRAM_ID
    );
    
    const tokenAccount = await token.createAccount(wallet.publicKey);
    
    try {
      // Register the product
      await program.methods
        .registerProduct(
          productUuidArray,
          new BN(500_000), // 0.5 SOL
          new BN(10),      // 10 in stock
          { none: {} },    // non-tokenized
          "https://example.com/product"
        )
        .accounts({
          product: productPda,
          store: wallet.publicKey,
          store_account: storePda,
          mint: token.publicKey,
          tokenAccount: tokenAccount,
          token_program: TOKEN_PROGRAM_ID,
          associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          payer: wallet.publicKey,
        })
        .rpc();
      
      console.log("Product registered successfully");
      
      // Verify product was created
      const product = await program.account.product.fetch(productPda);
      assert.equal(product.price.toNumber(), 500_000);
      assert.equal(product.stock.toNumber(), 10);
    } catch (err) {
      console.error("Error registering product:", err);
      throw err;
    }
  });

  it("completes a Solana Pay checkout flow", async () => {
    // Create receipt PDA
    [receiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), storePda.toBuffer(), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Receipt PDA:", receiptPda.toString());
    
    try {
      // Get wallet balance before purchase
      const balanceBefore = await provider.connection.getBalance(wallet.publicKey);
      console.log("Wallet balance before purchase:", balanceBefore);
      
      // Perform Solana Pay checkout (purchase cart)
      await program.methods
        .purchaseCart(
          [Array.from(productUuidBytes)],  // Product UUIDs
          [new BN(1)],                     // Quantities
          new BN(500_000),                 // Total amount (0.5 SOL)
          new BN(0),                       // Gas fee
          { success: {} }                  // Transaction status
        )
        .accounts({
          buyer: wallet.publicKey,
          store: storePda,
          receipt: receiptPda,
          store_owner: wallet.publicKey,
          escrow_account: escrowPda,
          system_program: SystemProgram.programId,
          payer: wallet.publicKey,
        })
        .remainingAccounts([
          { pubkey: productPda, isWritable: true, isSigner: false }
        ])
        .rpc();
      
      console.log("Purchase completed successfully");
      
      // Verify purchase was successful:
      
      // 1. Verify product stock was reduced
      const updatedProduct = await program.account.product.fetch(productPda);
      assert.equal(updatedProduct.stock.toNumber(), 9, "Product stock should be reduced by 1");
      
      // 2. Verify funds are in escrow
      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.equal(escrowAccount.balance.toNumber(), 500_000, "Payment should be in escrow");
      
      // 3. Verify receipt was created correctly
      const receipt = await program.account.purchase.fetch(receiptPda);
      assert.equal(receipt.totalPaid.toNumber(), 500_000, "Receipt total should match payment");
      assert.ok(receipt.buyer.equals(wallet.publicKey), "Receipt buyer should match wallet");
      
      // Release funds from escrow to complete the flow
      await program.methods
        .releaseEscrow(new BN(500_000))
        .accounts({
          store: wallet.publicKey,
          store_account: storePda,
          store_owner: wallet.publicKey,
          escrow_account: escrowPda,
          system_program: SystemProgram.programId,
          payer: wallet.publicKey,
        })
        .rpc();
      
      console.log("Escrow funds released successfully");
      
      // Verify escrow is empty after release
      const updatedEscrow = await program.account.escrow.fetch(escrowPda);
      assert.equal(updatedEscrow.balance.toNumber(), 0, "Escrow should be empty after release");
      
    } catch (err) {
      console.error("Error in Solana Pay checkout:", err);
      throw err;
    }
  });
});
