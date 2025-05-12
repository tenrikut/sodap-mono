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
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Token } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";

describe("sodap-solana-pay-loyalty-features", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  const wallet = provider.wallet;

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

  // Helper function to get account balance
  async function getBalance(pubkey: PublicKey): Promise<number> {
    return await provider.connection.getBalance(pubkey);
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

  // Helper function to create token mint for product and loyalty tokens
  async function createTokenMint(): Promise<[PublicKey, PublicKey]> {
    // Create a new mint account
    const mintAccount = Keypair.generate();
    
    // Fund wallet account
    await requestAirdrop(wallet.publicKey);
    
    // Get minimum lamports required for rent exemption
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(
      Token.MintLayout.span
    );
    
    // Create transaction instructions
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      space: Token.MintLayout.span,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    });
    
    const initMintInstruction = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      9, // 9 decimals like SOL
      wallet.publicKey,
      wallet.publicKey
    );
    
    // Create associated token account for the wallet
    const associatedTokenAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      wallet.publicKey
    );
    
    const createAssociatedTokenAccountInstruction = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      associatedTokenAddress,
      wallet.publicKey,
      wallet.publicKey
    );
    
    // Send transaction
    const tx = new Transaction().add(
      createAccountInstruction,
      initMintInstruction,
      createAssociatedTokenAccountInstruction
    );
    
    await provider.sendAndConfirm(tx, [mintAccount]);
    
    return [mintAccount.publicKey, associatedTokenAddress];
  }

  // Test setup - run once before all tests
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  
  before(async () => {
    // Fund the wallet for testing
    await requestAirdrop(wallet.publicKey);
    
    // Find the store PDA
    [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    // Find the escrow PDA
    [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
    
    // Initialize the program if needed
    try {
      await program.methods
        .initialize()
        .accounts({
          payer: wallet.publicKey,
          system_program: SystemProgram.programId
        })
        .rpc();
      console.log("Program initialized");
    } catch (err) {
      // Program may already be initialized
      console.log("Program initialization skipped:", err.message);
    }
  });

  // Test 1: Test Solana Pay checkout flow
  it("completes a Solana Pay checkout flow with escrow", async () => {
    // Register a store for testing payments
    const loyaltyConfig = {
      pointsPerDollar: new BN(10),
      minimumPurchase: new BN(100),
      rewardPercentage: new BN(5),
      isActive: true,
    };
    
    await program.methods
      .registerStore(
        wallet.publicKey,
        "Solana Pay Test Store",
        "A store to test Solana Pay checkout",
        "https://example.com/logo.png",
        loyaltyConfig
      )
      .accounts({
        store: storePda,
        owner: wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc();
    
    console.log("Store registered for Solana Pay testing");
    
    // Create a product for purchase
    const productUuidBytes = generateUniqueProductUuid();
    const productUuidArray = Array.from(productUuidBytes);
    
    // Find product PDA
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), storePda.toBuffer(), Buffer.from(productUuidBytes)],
      program.programId
    );
    
    // Create mint for product
    const [mint, tokenAccount] = await createTokenMint();
    
    // Register the product
    const productPrice = new BN(500); // 500 lamports
    const initialStock = new BN(10);
    
    await program.methods
      .registerProduct(
        productUuidArray,
        productPrice,
        initialStock,
        { none: {} }, // Non-tokenized product for simplicity
        "https://example.com/product"
      )
      .accounts({
        product: productPda,
        store: wallet.publicKey,
        store_account: storePda,
        mint,
        tokenAccount,
        token_program: TOKEN_PROGRAM_ID,
        associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log("Product registered for Solana Pay testing");
    
    // Verify product was created
    const product = await program.account.product.fetch(productPda);
    assert.equal(product.price.toNumber(), 500);
    assert.equal(product.stock.toNumber(), 10);
    
    // Find the cart PDA
    const [cartPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("cart"),
        wallet.publicKey.toBuffer(),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    // Get initial balance
    const initialBalance = await getBalance(wallet.publicKey);
    console.log(`Initial wallet balance: ${initialBalance}`);
    
    // Purchase the product using Solana Pay flow
    await program.methods
      .purchaseCart(
        [productUuidArray],  // Product UUIDs
        [new BN(1)],         // Quantities (buying 1 of the product)
        new BN(500),         // Total amount paid - must match product price * quantity
        new BN(0),           // Gas fee
        { success: {} },     // Transaction status
        null                 // Optional info
      )
      .accounts({
        buyer: wallet.publicKey,
        store: wallet.publicKey,
        store_account: storePda,
        cart: cartPda,
        escrow_account: escrowPda,
        product1: productPda, // First product
        product2: null,       // Rest are null since we only have one product
        product3: null,
        product4: null,
        product5: null,
        system_program: SystemProgram.programId,
        payer: wallet.publicKey,
      })
      .rpc();
    
    console.log("Product purchased with Solana Pay checkout");
    
    // Verify product stock was updated
    const updatedProduct = await program.account.product.fetch(productPda);
    assert.equal(updatedProduct.stock.toNumber(), 9, "Product stock should be reduced");
    
    // Check escrow balance (payment should be in escrow)
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.balance.toNumber(), 500, "Payment should be held in escrow");
    
    // Release the escrow to the store owner (in a real app, this might happen after delivery)
    await program.methods
      .releaseEscrow(new BN(500))
      .accounts({
        store: wallet.publicKey,
        store_account: storePda,
        store_owner: wallet.publicKey,
        escrow_account: escrowPda,
        system_program: SystemProgram.programId,
      })
      .rpc();
    
    console.log("Escrow released to store owner");
    
    // Verify escrow should be empty now
    const updatedEscrow = await program.account.escrow.fetch(escrowPda);
    assert.equal(updatedEscrow.balance.toNumber(), 0, "Escrow should be empty after release");
    
    // Check store revenue was updated
    const updatedStore = await program.account.store.fetch(storePda);
    assert.equal(updatedStore.revenue.toNumber(), 500, "Store revenue should be updated");
  });
  
  // Test 2: Test Loyalty Token functionality
  it("handles loyalty token minting and redemption", async () => {
    // Initialize loyalty mint
    const [loyaltyMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("loyalty_mint"), storePda.toBuffer()],
      program.programId
    );
    
    try {
      await program.methods
        .initializeLoyaltyMint()
        .accounts({
          store: storePda,
          loyalty_mint: loyaltyMintPda,
          authority: wallet.publicKey,
          system_program: SystemProgram.programId,
          token_program: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      console.log("Loyalty mint initialized");
    } catch (err) {
      // The loyalty mint might already be initialized
      console.log("Loyalty mint initialization error:", err.message);
    }
    
    // Create token account for customer to receive loyalty points
    const customerTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      loyaltyMintPda,
      wallet.publicKey
    );
    
    // Create the token account if it doesn't exist
    try {
      const tx = new Transaction().add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          loyaltyMintPda,
          customerTokenAccount,
          wallet.publicKey,          // Owner
          wallet.publicKey           // Payer
        )
      );
      await provider.sendAndConfirm(tx);
      console.log("Created token account for loyalty points");
    } catch (err) {
      // Account might already exist
      console.log("Token account creation error:", err.message);
    }
    
    // Mint loyalty tokens to customer
    const pointsToMint = 500; // 500 loyalty points
    
    await program.methods
      .mintLoyaltyPoints(
        new BN(pointsToMint),
        wallet.publicKey
      )
      .accounts({
        store: storePda,
        loyalty_mint: loyaltyMintPda,
        authority: wallet.publicKey,
        token_program: TOKEN_PROGRAM_ID,
        destination: customerTokenAccount,
      })
      .rpc();
    
    console.log("Minted loyalty points to customer");
    
    // Verify customer received loyalty tokens
    // Create a Token object to interact with the mint
    const tokenObject = new Token(
      provider.connection,
      loyaltyMintPda,
      TOKEN_PROGRAM_ID,
      wallet.payer
    );
    
    // Get token account info
    const tokenAccountInfo = await tokenObject.getAccountInfo(customerTokenAccount);
    
    assert.equal(
      Number(tokenAccountInfo.amount), 
      pointsToMint,
      "Token account should have the correct amount of loyalty points"
    );
    
    // Test redeeming points (partial redemption)
    const pointsToRedeem = 200;
    
    await program.methods
      .redeemLoyaltyPoints(new BN(pointsToRedeem))
      .accounts({
        store: storePda,
        loyalty_mint: loyaltyMintPda,
        authority: wallet.publicKey,
        token_program: TOKEN_PROGRAM_ID,
        source: customerTokenAccount,
      })
      .rpc();
    
    console.log("Redeemed loyalty points");
    
    // Verify points were redeemed (balance reduced)
    const updatedTokenAccountInfo = await tokenObject.getAccountInfo(customerTokenAccount);
    
    assert.equal(
      Number(updatedTokenAccountInfo.amount),
      pointsToMint - pointsToRedeem,
      "Token account balance should be reduced after redemption"
    );
  });
});
