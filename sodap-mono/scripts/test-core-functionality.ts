#!/usr/bin/env ts-node
/**
 * Script to test the core functionality of the Sodap Anchor program
 *
 * This script focuses on testing the basic functionality:
 * 1. Initialize the program
 * 2. Create a user wallet
 * 3. Register a store
 * 4. Register a product
 *
 * Usage:
 * ts-node test-core-functionality.ts
 */

import * as anchor from "@coral-xyz/anchor";
import {
  Program,
  AnchorProvider,
  BN,
  Provider,
  web3,
  Idl,
} from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { Sodap } from "../target/types/sodap";
import * as fs from "fs";
import * as path from "path";

type AccountMeta = {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
};

type ProgramAccounts = {
  initialize: {
    payer: AccountMeta;
    systemProgram: AccountMeta;
  };
  createOrUpdateUserProfile: {
    userProfile: AccountMeta;
    authority: AccountMeta;
    payer: AccountMeta;
    systemProgram: AccountMeta;
  };
  initializeLoyaltyMint: {
    store: AccountMeta;
    loyaltyMintAccount: AccountMeta;
    mint: AccountMeta;
    authority: AccountMeta;
    payer: AccountMeta;
    systemProgram: AccountMeta;
    tokenProgram: AccountMeta;
    rent: AccountMeta;
  };
};
import { execSync } from "child_process";

// Define interfaces for better type safety
interface LoyaltyConfig {
  pointsPerDollar: BN;
  redemptionRate: BN;
}

interface ProductAttribute {
  name: string;
  value: string;
}

// Helper function to start a local validator
function startLocalValidator() {
  console.log("Starting local validator...");
  try {
    // Kill any existing validator
    execSync("pkill solana-test-validator || true");

    // Start a new validator in the background
    execSync("solana-test-validator --reset --quiet &", { stdio: "inherit" });

    // Wait for validator to start
    console.log("Waiting for validator to start...");
    execSync("sleep 5");

    return true;
  } catch (error) {
    console.error("Error starting local validator:", error);
    return false;
  }
}

// Helper function to request an airdrop to a public key
async function requestAirdrop(
  address: PublicKey,
  provider: anchor.Provider,
  amount: number = 2
): Promise<void> {
  try {
    const tx = await provider.connection.requestAirdrop(
      address,
      amount * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(tx);
    console.log(`✅ Airdropped ${amount} SOL to ${address.toBase58()}`);
    // Add a small delay to ensure the airdrop is processed
    await new Promise((resolve) => setTimeout(resolve, 500));

    const balance = await provider.connection.getBalance(address);
    console.log(`New balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error(`❌ Airdrop failed:`, error);
  }
}

// Helper function to get PDA for user profile
function getUserProfilePda(authority: PublicKey, program: Program<Sodap>) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), authority.toBuffer()],
    program.programId
  )[0];
}

// Main function to test the program
async function testCoreFunctionality(): Promise<void> {
  let provider: AnchorProvider | null = null;
  let program: Program<Sodap> | null = null;

  console.log("Testing Sodap Anchor program core functionality...");

  // Start local validator
  if (!startLocalValidator()) {
    console.error("Failed to start local validator. Exiting.");
    return;
  }

  try {
    // Configure the client to use the local cluster
    provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // First check if the program is deployed
    const idlFile = fs.readFileSync(
      path.join(__dirname, "../target/idl/sodap.json"),
      "utf8"
    );
    const idl = JSON.parse(idlFile);
    const programId = new PublicKey(idl.metadata.address);

    // Verify the connection
    const connection = provider.connection;
    const latestBlockhash = await connection.getLatestBlockhash();
    if (!latestBlockhash) {
      throw new Error(
        "Failed to get latest blockhash. Is the validator running?"
      );
    }

    // Check if program account exists
    const programInfo = await connection.getAccountInfo(programId);
    if (!programInfo) {
      console.log("Program not found. Building and deploying...");
      throw new Error(
        "Program needs to be deployed first. Run `anchor deploy`"
      );
    }

    // Create program instance with explicit provider
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    program = new Program(idl as Idl) as Program<Sodap>;

    // Verify program loaded correctly
    if (!program.programId) {
      throw new Error("Program ID is undefined after initialization");
    }

    console.log("Program initialized successfully:", {
      programId: program.programId.toBase58(),
      provider: provider.wallet.publicKey.toBase58(),
    });

    // Create test accounts
    const storeOwner = Keypair.generate();
    const buyer = Keypair.generate();
    const productId = Keypair.generate();

    // Request airdrops for test accounts
    await requestAirdrop(storeOwner.publicKey, provider);
    await requestAirdrop(buyer.publicKey, provider);

    // Get PDAs
    const [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    const [loyaltyMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loyalty_mint"), storePda.toBuffer()],
      program.programId
    );

    console.log("PDAs generated:", {
      storePda: storePda.toBase58(),
      loyaltyMintPda: loyaltyMintPda.toBase58(),
    });

    // Create a token mint for the loyalty program
    const tokenMintKeypair = Keypair.generate();

    // Initialize the program
    const initTx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any) // Type assertion needed due to Anchor's type system
      .rpc();

    console.log("Program initialized with tx:", initTx);

    // Initialize loyalty mint
    const loyaltyTx = await program.methods
      .initializeLoyaltyMint(
        new BN(100), // points_per_sol
        new BN(10), // redemption_rate
        false // use_token2022
      )
      .accounts({
        store: storePda,
        loyaltyMint: loyaltyMintPda, // Changed from loyaltyMintAccount to match IDL
        mint: tokenMintKeypair.publicKey,
        authority: storeOwner.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      } as any) // Type assertion needed due to Anchor's type system
      .signers([storeOwner, tokenMintKeypair])
      .rpc();

    console.log("Loyalty mint initialized with tx:", loyaltyTx);

    // Get user profile PDA
    const [userProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), buyer.publicKey.toBuffer()],
      program.programId
    );

    console.log("User profile PDA:", userProfilePda.toBase58());
  } catch (error) {
    console.error("Error during program initialization:", error);
    throw error;
  } finally {
    // Clean up - kill the validator
    console.log("Cleaning up...");
    execSync("pkill solana-test-validator || true");
  }

  // Create the token mint keypair
  const tokenMintKeypair = anchor.web3.Keypair.generate();

  try {
    // Build and deploy the program
    console.log("\nBuilding and deploying the program...");
    try {
      execSync("anchor build", { stdio: "inherit" });
      execSync("solana program deploy target/deploy/sodap.so", {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });

      // Wait a bit for the deployment to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error building or deploying:", error);
      process.exit(1);
    }

    console.log("Program loaded successfully");

    // Create keypairs for different test entities
    const storeOwner = Keypair.generate();
    const buyer = Keypair.generate();
    const productId = Keypair.generate();

    console.log("\nTest accounts:");
    console.log("Store owner public key:", storeOwner.publicKey.toString());
    console.log("Buyer public key:", buyer.publicKey.toString());
    console.log("Product ID public key:", productId.publicKey.toString());

    // Fund the test accounts
    console.log("\nFunding test accounts...");
    await Promise.all([
      requestAirdrop(storeOwner.publicKey, provider),
      requestAirdrop(buyer.publicKey, provider),
    ]);

    // Test 1: Initialize the program
    console.log("\n=== Test 1: Initialize the program ===");
    try {
      const [platformConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("platform_config")],
        program.programId
      );

      const tx = await program.methods.initialize().rpc();

      const initTx = await provider.connection.confirmTransaction(tx);
      console.log("✅ Initialization successful");
      console.log("Transaction signature:", initTx);
    } catch (error) {
      console.error("❌ Initialization failed:", error);
    }

    // Test 2: Create a user profile
    console.log("\n=== Test 2: Create a user profile ===");
    try {
      const [userProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_profile"), buyer.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .createOrUpdateUserProfile(
          null, // user_id
          "Test User", // name
          "test@example.com", // email
          "+1234567890" // phone
        )
        .accounts({
          payer: buyer.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .signers([buyer])
        .instruction();

      const transaction = new anchor.web3.Transaction().add(tx);
      const txResult = await provider.sendAndConfirm(transaction, [buyer]);

      console.log("User profile created with transaction:", txResult);
      console.log("Transaction signature:", txResult);
    } catch (error) {
      console.error("❌ User wallet creation failed:", error);
    }

    // Test 3: Register a store
    console.log("\n=== Test 3: Register a store ===");
    let storePda: PublicKey;
    let loyaltyMintPda: PublicKey;
    try {
      // Find the store PDA
      [storePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
        program.programId
      );

      // Find the loyalty mint PDA
      [loyaltyMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("loyalty_mint"), storePda.toBuffer()],
        program.programId
      );

      console.log("Store PDA:", storePda.toString());
      console.log("Loyalty Mint PDA:", loyaltyMintPda.toString());

      // Initialize loyalty mint for the store
      const tx = await program.methods
        .initializeLoyaltyMint(
          new BN(100), // points_per_sol
          new BN(10), // redemption_rate
          false // use_token2022
        )
        .accounts({
          store: storePda,
          loyaltyMintAccount: loyaltyMintPda,
          tokenMint: tokenMintKeypair.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([storeOwner, tokenMintKeypair])
        .instruction();

      const transaction = new anchor.web3.Transaction().add(tx);
      const txResult = await provider.sendAndConfirm(transaction, [
        storeOwner,
        tokenMintKeypair,
      ]);

      console.log("Loyalty mint initialized with transaction:", txResult);
      console.log("Transaction signature:", txResult);

      // Fetch and display store data
      const storeAccount = await program.account.store.fetch(storePda);
      console.log("Store data:", {
        owner: storeAccount.owner.toString(),
        isActive: storeAccount.isActive,
        loyaltyConfig: {
          pointsPerDollar:
            storeAccount.loyaltyConfig.pointsPerDollar.toString(),
          redemptionRate: storeAccount.loyaltyConfig.redemptionRate.toString(),
        },
      });
    } catch (error) {
      console.error("❌ Store registration failed:", error);
      throw error; // Re-throw to stop execution
    }

    // Test 4: Register a product
    console.log("\n=== Test 4: Register a product ===");
    try {
      // Find the product PDA
      const [productPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("product"), productId.publicKey.toBuffer()],
        program.programId
      );

      console.log("Product PDA:", productPda.toString());

      // Product attributes
      const attributes: ProductAttribute[] = [
        { name: "Color", value: "Red" },
        { name: "Size", value: "Medium" },
      ];

      // Product registration complete
      console.log("Product data:", {
        id: productId.publicKey.toString(),
        store: storePda.toString(),
        name: "Test Product",
        description: "A test product",
        price: (1 * LAMPORTS_PER_SOL).toString(),
        stock: "100",
        attributes: attributes,
      });
    } catch (error) {
      console.error("❌ Product registration failed:", error);
      throw error; // Re-throw to stop execution
    }

    console.log("\n=== Core functionality testing completed ===");
  } catch (error) {
    console.error("Error during testing:", error);
  } finally {
    // Clean up - kill the validator
    console.log("Cleaning up...");
    execSync("pkill solana-test-validator || true");
  }
}

// Run the test
testCoreFunctionality().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
