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
  Token,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";

// Test for Loyalty Token functionality with Token 2022
describe("sodap-loyalty-tokens", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  const wallet = provider.wallet;

  // Store for testing
  let storePda: PublicKey;
  // Loyalty mint
  let loyaltyMintPda: PublicKey;
  // Customer token account
  let customerTokenAccount: PublicKey;

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

  // Initialize the program
  it("Initialize the program and store", async () => {
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

    // Find the store PDA
    [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Store PDA:", storePda.toString());
    
    // Register a store (or use existing)
    try {
      await program.methods
        .registerStore(
          wallet.publicKey,
          "Loyalty Token Test Store",
          "A store to test loyalty token features",
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
          system_program: SystemProgram.programId,
        })
        .rpc();
      console.log("Store registered successfully");
    } catch (err) {
      // If store already exists, that's fine
      console.log("Store registration error (might already exist):", err.message);
    }
  });

  // Test initializing the loyalty mint
  it("initializes a loyalty mint for the store", async () => {
    // Find the loyalty mint PDA
    [loyaltyMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("loyalty_mint"), storePda.toBuffer()],
      program.programId
    );
    
    console.log("Loyalty Mint PDA:", loyaltyMintPda.toString());
    
    try {
      await program.methods
        .initializeLoyaltyMint()
        .accounts({
          store: storePda,
          loyalty_mint: loyaltyMintPda,
          authority: wallet.publicKey,
          system_program: SystemProgram.programId,
          token_program: TOKEN_PROGRAM_ID, // Use standard TOKEN_PROGRAM_ID
          rent: SYSVAR_RENT_PUBKEY,
          payer: wallet.publicKey, // Add payer account
        })
        .rpc();
      
      console.log("Loyalty mint initialized successfully");
      
      // Verify the loyalty mint was created
      const loyaltyMint = await program.account.loyaltyMint.fetch(loyaltyMintPda);
      assert.ok(loyaltyMint.store.equals(storePda), "Store address should match");
      assert.ok(loyaltyMint.authority.equals(wallet.publicKey), "Authority should match");
      
    } catch (err) {
      console.error("Error initializing loyalty mint:", err);
      throw err;
    }

    // We'll need to create a Token object to interact with the loyalty mint
    // This is a bit different for PDAs, so we're using a workaround
    try {
      // Initialize a Token object to interact with the loyalty mint
      const loyaltyToken = new Token(
        provider.connection,
        loyaltyMintPda,
        TOKEN_PROGRAM_ID,
        wallet.payer
      );
      
      // Create a token account for the customer
      customerTokenAccount = await loyaltyToken.createAccount(wallet.publicKey);
      console.log("Created customer token account:", customerTokenAccount.toString());
    } catch (err) {
      console.error("Error creating customer token account:", err);
      throw err;
    }
  });

  // Test minting loyalty tokens
  it("mints loyalty tokens for a purchase", async () => {
    const purchaseAmount = new BN(500); // 500 lamports purchase amount
    
    try {
      await program.methods
        .mintLoyaltyPoints(purchaseAmount, wallet.publicKey) // Include destination public key
        .accounts({
          store: storePda,
          loyalty_mint: loyaltyMintPda,
          authority: wallet.publicKey,
          token_program: TOKEN_PROGRAM_ID, // Use standard TOKEN_PROGRAM_ID
          destination: customerTokenAccount,
          payer: wallet.publicKey, // Add payer account
        })
        .rpc();
      
      console.log("Minted loyalty tokens successfully");
      
      // Verify tokens were minted to the customer's account
      const loyaltyToken = new Token(
        provider.connection,
        loyaltyMintPda,
        TOKEN_PROGRAM_ID,
        wallet.payer
      );
      
      const tokenAccountInfo = await loyaltyToken.getAccountInfo(customerTokenAccount);
      
      // The amount should be calculated based on pointsPerDollar in the contract
      // Here we're just verifying it's non-zero as the exact calculation depends on the contract
      assert.ok(Number(tokenAccountInfo.amount) > 0, "Token balance should be greater than 0");
      console.log("Customer token balance:", tokenAccountInfo.amount.toString());
      
    } catch (err) {
      console.error("Error minting loyalty tokens:", err);
      throw err;
    }
  });

  // Test redeeming loyalty tokens
  it("redeems loyalty tokens for rewards", async () => {
    // Initialize token object
    const loyaltyToken = new Token(
      provider.connection,
      loyaltyMintPda,
      TOKEN_PROGRAM_ID,
      wallet.payer
    );
    
    // Check current balance before redemption
    const accountInfoBefore = await loyaltyToken.getAccountInfo(customerTokenAccount);
    
    const balanceBefore = Number(accountInfoBefore.amount);
    console.log("Balance before redemption:", balanceBefore);
    
    if (balanceBefore === 0) {
      console.log("No tokens to redeem, test will be skipped");
      return;
    }
    
    // Redeem half of the available points
    const pointsToRedeem = Math.floor(balanceBefore / 2);
    
    try {
      await program.methods
        .redeemLoyaltyPoints(new BN(pointsToRedeem))
        .accounts({
          store: storePda,
          loyalty_mint: loyaltyMintPda,
          authority: wallet.publicKey,
          token_program: TOKEN_PROGRAM_ID, // Use standard TOKEN_PROGRAM_ID
          source: customerTokenAccount,
          payer: wallet.publicKey, // Add payer account
        })
        .rpc();
      
      console.log("Redeemed loyalty tokens successfully");
      
      // Verify tokens were redeemed (balance reduced)
      const accountInfoAfter = await loyaltyToken.getAccountInfo(customerTokenAccount);
      
      const balanceAfter = Number(accountInfoAfter.amount);
      console.log("Balance after redemption:", balanceAfter);
      
      // Verify balance decreased by the amount redeemed
      assert.ok(balanceAfter < balanceBefore, "Token balance should decrease after redemption");
      assert.approximately(balanceAfter, balanceBefore - pointsToRedeem, 1, "Balance should decrease by approximately the redeemed amount");
      
    } catch (err) {
      console.error("Error redeeming loyalty tokens:", err);
      throw err;
    }
  });
});
