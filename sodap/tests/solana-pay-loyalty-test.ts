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
  createAssociatedTokenAccountInstruction,
  getMint,
  getAccount,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import * as token from "@solana/spl-token";

describe("sodap-solana-pay-loyalty", () => {
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
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Helper function to create a new token mint and associated token account for the store
  async function createMint(
    storeOwnerPubkey: PublicKey
  ): Promise<[PublicKey, PublicKey]> {
    // For testing we'll use the default wallet
    const mintAuthority = wallet.publicKey;
    const decimals = 0;

    // Create a new mint
    const mintAccount = anchor.web3.Keypair.generate();

    // Fund the account
    await requestAirdrop(wallet.publicKey);

    const lamports = await provider.connection.getMinimumBalanceForRentExemption(
      token.MintLayout.span
    );

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      space: token.MintLayout.span,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    });

    const initMintInstruction = token.createInitMintInstruction(
      mintAccount.publicKey,
      decimals,
      mintAuthority,
      null
    );

    // Create associated token account owned by the store
    const associatedTokenAddress = await token.getAssociatedTokenAddress(
      mintAccount.publicKey,
      storeOwnerPubkey
    );

    const createAssociatedTokenAccountInstruction =
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAddress,
        storeOwnerPubkey,
        mintAccount.publicKey
      );

    const transaction = new Transaction().add(
      createAccountInstruction,
      initMintInstruction,
      createAssociatedTokenAccountInstruction
    );

    // Sign and send the transaction
    await provider.sendAndConfirm(transaction, [mintAccount]);

    return [mintAccount.publicKey, associatedTokenAddress];
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

  // Helper function to get account balance
  async function getBalance(pubkey: PublicKey): Promise<number> {
    return await provider.connection.getBalance(pubkey);
  }

  // Test Solana Pay Checkout Flow
  it("successfully completes a Solana Pay checkout", async () => {
    // Use the provider wallet for both store owner and customer for simplicity
    // In a real scenario, these would be different wallets
    const storeOwner = wallet;
    const customer = wallet;
    
    // Get initial balance
    const initialBalance = await getBalance(wallet.publicKey);
    console.log(`Initial balance: ${initialBalance}`);
    
    // Find the store PDA
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    // Register the store with loyalty program
    const loyaltyConfig = {
      pointsPerDollar: new BN(10),
      minimumPurchase: new BN(100),
      rewardPercentage: new BN(5),
      isActive: true,
    };
    
    await program.methods
      .registerStore(
        wallet.publicKey,
        "Test Store",
        "A test store for checkout",
        "https://example.com/logo.png",
        loyaltyConfig
      )
      .accounts({
        store: storePda,
        owner: wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc();
      
    // Verify store was created
    const storeAccount = await program.account.store.fetch(storePda);
    assert.equal(storeAccount.name, "Test Store");
    
    // Create a product
    const productUuidBytes = generateUniqueProductUuid();
    const productUuidArray = Array.from(productUuidBytes);
    
    // Find product PDA
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), storePda.toBuffer(), Buffer.from(productUuidBytes)],
      program.programId
    );
    
    // Create mint for tokenized product (NFT)
    const [mint, tokenAccount] = await createMint(wallet.publicKey);
    
    // Register the product
    const productPrice = new anchor.BN(500); // 500 lamports
    const initialStock = new anchor.BN(10);
    
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
        payer: wallet.publicKey,
      })
      .rpc();
      
    // Verify product created
    const product = await program.account.product.fetch(productPda);
    assert.equal(product.price.toNumber(), 500);
    
    // Find the cart PDA
    const [cartPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("cart"),
        wallet.publicKey.toBuffer(),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    // Find the escrow PDA
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
    
    // Use Solana Pay checkout (purchasing product directly)
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
      
    // Verify product stock was updated
    const updatedProduct = await program.account.product.fetch(productPda);
    assert.equal(updatedProduct.stock.toNumber(), 9);
    
    // Check escrow balance (payment should be in escrow)
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.balance.toNumber(), 500);
    
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
      
    // Verify escrow should be empty now
    const updatedEscrow = await program.account.escrow.fetch(escrowPda);
    assert.equal(updatedEscrow.balance.toNumber(), 0);
    
    // Check store revenue was updated
    const updatedStore = await program.account.store.fetch(storePda);
    assert.equal(updatedStore.revenue.toNumber(), 500);
  });
  
  // Test Loyalty Token Functionality
  it("successfully mints and redeems loyalty tokens", async () => {
    // Use the provider wallet for both store owner and customer for simplicity
    // In a real scenario, these would be different wallets
    
    // Find the store PDA
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    // Register the store with loyalty program
    const loyaltyConfig = {
      pointsPerDollar: new BN(10),  // 10 points per 1 SOL spent
      minimumPurchase: new BN(100), // Minimum purchase to qualify for loyalty points
      rewardPercentage: new BN(5),  // 5% discount when redeeming points
      isActive: true,
    };
    
    await program.methods
      .registerStore(
        wallet.publicKey,
        "Loyalty Test Store",
        "A test store for loyalty points",
        "https://example.com/logo.png",
        loyaltyConfig
      )
      .accounts({
        store: storePda,
        owner: wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc();
    
    // Initialize loyalty mint
    const [loyaltyMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("loyalty_mint"), storePda.toBuffer()],
      program.programId
    );
    
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
    
    // Create token account for customer to receive loyalty points
    const customerTokenAccount = await token.getAssociatedTokenAddress(
      loyaltyMintPda,
      wallet.publicKey
    );
    
    // Create the token account if it doesn't exist
    const accountInfo = await provider.connection.getAccountInfo(customerTokenAccount);
    if (!accountInfo) {
      const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,          // Payer
          customerTokenAccount,      // Token account address
          wallet.publicKey,          // Owner
          loyaltyMintPda             // Mint
        )
      );
      await provider.sendAndConfirm(tx);
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
    
    // Verify customer received loyalty tokens
    const tokenAccountInfo = await getAccount(
      provider.connection,
      customerTokenAccount
    );
    
    assert.equal(Number(tokenAccountInfo.amount), pointsToMint);
    
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
    
    // Verify points were redeemed (balance reduced)
    const updatedTokenAccountInfo = await getAccount(
      provider.connection,
      customerTokenAccount
    );
    
    assert.equal(
      Number(updatedTokenAccountInfo.amount),
      pointsToMint - pointsToRedeem
    );
  });
});
