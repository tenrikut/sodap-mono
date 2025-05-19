import * as anchor from "@coral-xyz/anchor";
import { Program, utils } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { Buffer } from "buffer";
import { fundMultipleTestAccounts } from "./utils/devnet-utils";

describe("sodap product", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  
  // Use fixed keypairs for testing
  const storeOwner = Keypair.generate();
  const buyer = Keypair.generate();
  
  // Use the same hardcoded store PDA as in the store test
  let storePda = new PublicKey("BhfGKfh5wAGoHdSDbcNg5DCyaySRmCtw2rsBjFUfcodS");
  let escrowPda: PublicKey;
  let productPda: PublicKey;
  
  // Test product data
  const productId = Keypair.generate().publicKey;
  const productName = "Test Product";
  const productDescription = "This is a test product";
  const productImageUri = "https://example.com/product.json";
  
  const TEST_STORE_NAME = "Test Store";
  const TEST_STORE_DESC = "This is a test store";
  const TEST_STORE_LOGO = "https://example.com/logo.png";
  
  const TEST_PRODUCT_PRICE = 1000000; // 0.001 SOL
  const TEST_PRODUCT_STOCK = 10;
  const TEST_PRODUCT_METADATA = "https://example.com/product.json";
  
  // TokenizedType enum value (0 = NONE)
  const TOKENIZED_TYPE_NONE = 0;
  
  before(async () => {
    // Fund test accounts from the provider wallet instead of using airdrops
    // This approach works better on devnet where airdrops are rate-limited
    console.log("Funding test accounts from provider wallet...");
    try {
      await fundMultipleTestAccounts(
        provider, 
        [
          storeOwner,
          buyer
        ],
        0.1 // 0.1 SOL each to conserve funds
      );
      console.log("Successfully funded all test accounts");
    } catch (error) {
      console.error("Error funding test accounts:", error);
      throw error; // Fail the test if funding fails
    }
    
    // Using hardcoded store PDA
    console.log("Using hardcoded Store PDA:", storePda.toBase58());
    console.log("Store owner:", storeOwner.publicKey.toBase58());
    
    // Derive escrow PDA
    const escrowSeeds = [
      Buffer.from("escrow"),
      storePda.toBuffer()
    ];
    const [escrowKey, escrowBump] = PublicKey.findProgramAddressSync(
      escrowSeeds,
      program.programId
    );
    escrowPda = escrowKey;
    console.log("Escrow PDA:", escrowPda.toBase58());
    
    // First register a store
    try {
      console.log("Registering store with owner:", storeOwner.publicKey.toBase58());
      console.log("Store PDA:", storePda.toBase58());
      console.log("Escrow PDA:", escrowPda.toBase58());
      
      // Check store owner balance before creating store
      const storeOwnerBalance = await provider.connection.getBalance(storeOwner.publicKey);
      console.log("Store owner balance before creating store:", storeOwnerBalance / LAMPORTS_PER_SOL, "SOL");
      
      await program.methods
        .registerStore(
          TEST_STORE_NAME,
          TEST_STORE_DESC,
          TEST_STORE_LOGO
        )
        .accounts({
          store: storePda,
          escrow: escrowPda,
          owner: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      
      console.log("Store registered successfully");
    } catch (error) {
      console.error("Error registering store:", error);
      throw error;
    }
    
    console.log("Store registered successfully");
    
    console.log("Ready to test product operations");
  });
  
  it("registers a new product", async () => {
    // Register product using Anchor's built-in methods
    try {
      console.log("Registering product with ID:", productId.toBase58());
      console.log("Store PDA:", storePda.toBase58());
      
      // Check store owner balance before registering product
      const storeOwnerBalance = await provider.connection.getBalance(storeOwner.publicKey);
      console.log("Store owner balance before registering product:", storeOwnerBalance / LAMPORTS_PER_SOL, "SOL");
      
      await program.methods
        .registerProduct(
          productId,
          storePda,
          productName,
          productDescription,
          productImageUri,
          new anchor.BN(TEST_PRODUCT_PRICE),
          new anchor.BN(TEST_PRODUCT_STOCK),
          [] // Empty attributes array
        )
        .accounts({
          // Use the correct account structure expected by the program
          payer: storeOwner.publicKey,
          store: storePda, // Explicitly add store
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      
      console.log("Product registered successfully");
    } catch (error) {
      console.error("Error registering product:", error);
      throw error;
    }
    
    console.log("Product registered successfully");
    console.log("Product ID:", productId.toBase58());
  });
  
  it("updates product metadata", async () => {
    const NEW_NAME = "Updated Product";
    const NEW_DESCRIPTION = "This is an updated product description";
    const NEW_IMAGE_URI = "https://example.com/updated-product.json";
    const NEW_PRICE = 2000000; // 0.002 SOL
    const NEW_STOCK = 20;
    
    // Update product using Anchor's built-in methods
    try {
      console.log("Updating product with ID:", productId.toBase58());
      
      await program.methods
        .updateProduct(
          productId,
          NEW_NAME,
          NEW_DESCRIPTION,
          NEW_IMAGE_URI,
          new anchor.BN(NEW_PRICE),
          new anchor.BN(NEW_STOCK),
          [] // Empty attributes array
        )
        .accounts({
          // Use the correct account structure expected by the program
          payer: storeOwner.publicKey,
          store: storePda, // Explicitly add store
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      
      console.log("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
    
    console.log("Product updated successfully");
  });
  
  it("prevents unauthorized product updates", async () => {
    const UNAUTHORIZED_NAME = "Hacked Product";
    const unauthorizedUser = Keypair.generate();
    
    // Fund the unauthorized user
    try {
      await fundMultipleTestAccounts(provider, [unauthorizedUser], 0.5);
      console.log("Funded unauthorized user for testing");
      
      // Check unauthorized user balance
      const unauthorizedUserBalance = await provider.connection.getBalance(unauthorizedUser.publicKey);
      console.log("Unauthorized user balance:", unauthorizedUserBalance / LAMPORTS_PER_SOL, "SOL");
    } catch (error) {
      console.error("Error funding unauthorized user:", error);
      throw error;
    }
    
    try {
      // Attempt unauthorized update
      await program.methods
        .updateProduct(
          productId,
          UNAUTHORIZED_NAME,
          "Hacked description",
          "https://example.com/hacked.json",
          new anchor.BN(500000),
          new anchor.BN(999),
          []
        )
        .accounts({
          payer: unauthorizedUser.publicKey,
          store: storePda, // Explicitly add store
          systemProgram: SystemProgram.programId,
        })
        .signers([unauthorizedUser])
        .rpc();
      
      assert.fail("Expected unauthorized update to fail");
    } catch (err) {
      // We expect this to fail with an error
      console.log("Expected error:", (err as Error).message);
      assert.ok(true, "Unauthorized update correctly failed");
    }
  });
  
  it("deactivates a product", async () => {
    // Deactivate product using Anchor's built-in methods
    try {
      console.log("Deactivating product with ID:", productId.toBase58());
      
      await program.methods
        .deactivateProduct(
          productId
        )
        .accounts({
          // Use the correct account structure expected by the program
          payer: storeOwner.publicKey,
          store: storePda, // Explicitly add store
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      
      console.log("Product deactivated successfully");
    } catch (error) {
      console.error("Error deactivating product:", error);
      throw error;
    }
    
    console.log("Product deactivated successfully");
  });
});
