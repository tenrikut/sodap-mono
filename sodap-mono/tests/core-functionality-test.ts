// @ts-nocheck - Disable TypeScript checking for this file due to Anchor-generated type mismatches

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert, expect } from "chai";

describe("SODAP Core Functionality Tests", () => {
  // Initialize provider and program instances
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  
  // Create keypairs for different test entities
  const storeOwner = Keypair.generate();
  const buyer = provider.wallet.payer;
  const storeAdmin = Keypair.generate();
  const productId = Keypair.generate();
  
  // Store PDA and other variables
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  let loyaltyMintPda: PublicKey;
  let receiptKeypair: Keypair;
  let loyaltyMint: PublicKey;
  let buyerTokenAccount: PublicKey;
  
  // Helper function to request an airdrop to a public key
  async function requestAirdrop(publicKey: PublicKey, amount = 10 * LAMPORTS_PER_SOL) {
    const signature = await provider.connection.requestAirdrop(
      publicKey,
      amount
    );
    await provider.connection.confirmTransaction(signature, "confirmed");
    // Add a small delay to ensure the airdrop is processed
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  before(async () => {
    // Fund the test accounts
    await requestAirdrop(storeOwner.publicKey);
    await requestAirdrop(storeAdmin.publicKey);
    
    console.log("Store owner funded:", storeOwner.publicKey.toString());
    console.log("Buyer funded:", buyer.publicKey.toString());
  });

  it("Initialize the program", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    console.log("Initialization transaction signature:", tx);
  });

  it("Register a new store", async () => {
    // Find the store PDA
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Store PDA:", storePda.toString());
    
    // Create store with loyalty program
    const loyaltyConfig = {
      enabled: true,
      pointsPerSol: new BN(100), // 100 points per SOL spent
      minPurchaseAmount: new BN(0.1 * LAMPORTS_PER_SOL), // 0.1 SOL minimum purchase
      pointsRedemptionRate: new BN(10), // 10 points = 0.01 SOL
    };
    
    const tx = await program.methods
      .registerStore(
        "Test Store",
        "A test store for SODAP",
        "https://example.com/logo.png",
        loyaltyConfig
      )
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    console.log("Store registration transaction signature:", tx);
    
    // Verify store data
    const storeAccount = await program.account.store.fetch(storePda);
    assert.equal(storeAccount.name, "Test Store");
    assert.equal(storeAccount.owner.toString(), storeOwner.publicKey.toString());
    assert.isTrue(storeAccount.isActive);
  });

  it("Register a product", async () => {
    // Find the product PDA
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), productId.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Product PDA:", productPda.toString());
    
    // Product attributes
    const attributes = [
      { name: "Color", value: "Red" },
      { name: "Size", value: "Medium" },
    ];
    
    // Register the product
    const tx = await program.methods
      .registerProduct(
        productId.publicKey,
        "Test Product",
        "A test product for SODAP",
        "https://example.com/product.png",
        new BN(1 * LAMPORTS_PER_SOL), // 1 SOL price
        new BN(100), // 100 units in stock
        attributes
      )
      .accounts({
        store: storePda,
        product: productPda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    console.log("Product registration transaction signature:", tx);
    
    // Verify product data
    const productAccount = await program.account.product.fetch(productPda);
    assert.equal(productAccount.name, "Test Product");
    assert.equal(productAccount.price.toString(), new BN(1 * LAMPORTS_PER_SOL).toString());
    assert.equal(productAccount.stock.toString(), "100");
    assert.isTrue(productAccount.isActive);
  });

  it("Initialize loyalty mint for the store", async () => {
    // Find the loyalty mint PDA
    [loyaltyMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loyalty_mint"), storePda.toBuffer()],
      program.programId
    );
    
    console.log("Loyalty Mint PDA:", loyaltyMintPda.toString());
    
    // Create a new mint for loyalty tokens
    const mintAuthority = storeOwner;
    loyaltyMint = await createMint(
      provider.connection,
      storeOwner,
      mintAuthority.publicKey,
      null,
      0 // 0 decimals for loyalty points
    );
    
    console.log("Loyalty Mint created:", loyaltyMint.toString());
    
    // Create the buyer's token account
    const buyerTokenAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      loyaltyMint,
      buyer.publicKey
    );
    buyerTokenAccount = buyerTokenAccountInfo.address;
    
    console.log("Buyer token account:", buyerTokenAccount.toString());
    
    // Initialize the loyalty mint info
    const tx = await program.methods
      .initializeLoyaltyMint()
      .accounts({
        store: storePda,
        loyaltyMintInfo: loyaltyMintPda,
        tokenMint: loyaltyMint,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    console.log("Loyalty mint initialization transaction signature:", tx);
    
    // Verify loyalty mint info
    const loyaltyMintInfo = await program.account.loyaltyMint.fetch(loyaltyMintPda);
    assert.equal(loyaltyMintInfo.store.toString(), storePda.toString());
    assert.equal(loyaltyMintInfo.mint.toString(), loyaltyMint.toString());
    assert.equal(loyaltyMintInfo.authority.toString(), storeOwner.publicKey.toString());
  });

  it("Purchase a product and earn loyalty points", async () => {
    // Find the escrow PDA
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
    
    console.log("Escrow PDA:", escrowPda.toString());
    
    // Find the product PDA
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), productId.publicKey.toBuffer()],
      program.programId
    );
    
    // Create a new receipt keypair
    receiptKeypair = Keypair.generate();
    
    // Purchase the product
    const quantity = new BN(1);
    const totalAmount = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL for 1 product
    
    const tx = await program.methods
      .purchaseCart(
        [productId.publicKey],
        [quantity],
        totalAmount
      )
      .accounts({
        store: storePda,
        receipt: receiptKeypair.publicKey,
        buyer: buyer.publicKey,
        storeOwner: storeOwner.publicKey,
        escrowAccount: escrowPda,
        loyaltyMintInfo: loyaltyMintPda,
        tokenMint: loyaltyMint,
        tokenAccount: buyerTokenAccount,
        mintAuthority: storeOwner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([receiptKeypair, buyer, storeOwner])
      .remainingAccounts([
        {
          pubkey: productPda,
          isWritable: true,
          isSigner: false,
        },
      ])
      .rpc();
    
    console.log("Purchase transaction signature:", tx);
    
    // Verify receipt
    const receiptAccount = await program.account.receipt.fetch(receiptKeypair.publicKey);
    assert.equal(receiptAccount.store.toString(), storePda.toString());
    assert.equal(receiptAccount.buyer.toString(), buyer.publicKey.toString());
    assert.equal(receiptAccount.totalAmount.toString(), totalAmount.toString());
    
    // Verify product stock was reduced
    const productAccount = await program.account.product.fetch(productPda);
    assert.equal(productAccount.stock.toString(), "99"); // 100 - 1 = 99
    
    // Verify loyalty points were issued
    const buyerTokenAccountInfo = await provider.connection.getTokenAccountBalance(buyerTokenAccount);
    console.log("Buyer loyalty points balance:", buyerTokenAccountInfo.value.amount);
    expect(parseInt(buyerTokenAccountInfo.value.amount)).to.be.greaterThan(0);
  });

  it("Release funds from escrow to store owner", async () => {
    // Get initial balances
    const initialStoreOwnerBalance = await provider.connection.getBalance(storeOwner.publicKey);
    const initialEscrowBalance = await provider.connection.getBalance(escrowPda);
    
    console.log("Initial store owner balance:", initialStoreOwnerBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Initial escrow balance:", initialEscrowBalance / LAMPORTS_PER_SOL, "SOL");
    
    // Release funds from escrow
    const tx = await program.methods
      .releaseEscrow()
      .accounts({
        store: storePda,
        storeOwner: storeOwner.publicKey,
        escrowAccount: escrowPda,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    console.log("Release escrow transaction signature:", tx);
    
    // Verify balances after release
    const finalStoreOwnerBalance = await provider.connection.getBalance(storeOwner.publicKey);
    const finalEscrowBalance = await provider.connection.getBalance(escrowPda);
    
    console.log("Final store owner balance:", finalStoreOwnerBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Final escrow balance:", finalEscrowBalance / LAMPORTS_PER_SOL, "SOL");
    
    // The store owner should have received the funds from escrow
    expect(finalStoreOwnerBalance).to.be.greaterThan(initialStoreOwnerBalance);
    // The escrow account should have less funds
    expect(finalEscrowBalance).to.be.lessThan(initialEscrowBalance);
  });

  it("Redeem loyalty points", async () => {
    // Get initial balances
    const initialBuyerBalance = await provider.connection.getBalance(buyer.publicKey);
    const initialTokenBalance = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
    
    console.log("Initial buyer SOL balance:", initialBuyerBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Initial buyer token balance:", initialTokenBalance, "points");
    
    // Amount of points to redeem (all available points)
    const pointsToRedeem = new BN(initialTokenBalance);
    
    // Redeem points for SOL
    const tx = await program.methods
      .redeemLoyaltyPoints(pointsToRedeem, true) // true = redeem for SOL
      .accounts({
        store: storePda,
        loyaltyMintAccount: loyaltyMintPda,
        tokenMint: loyaltyMint,
        tokenAccount: buyerTokenAccount,
        user: buyer.publicKey,
        escrowAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    
    console.log("Redeem loyalty points transaction signature:", tx);
    
    // Verify balances after redemption
    const finalBuyerBalance = await provider.connection.getBalance(buyer.publicKey);
    const finalTokenBalance = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
    
    console.log("Final buyer SOL balance:", finalBuyerBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Final buyer token balance:", finalTokenBalance, "points");
    
    // The buyer should have received SOL for their points
    expect(finalBuyerBalance).to.be.greaterThan(initialBuyerBalance);
    // The token balance should be reduced
    expect(parseInt(finalTokenBalance)).to.be.lessThan(parseInt(initialTokenBalance));
  });
});
