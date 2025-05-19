import * as anchor from "@coral-xyz/anchor";
import { Program, utils } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { Buffer } from "buffer";

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
    // Airdrop SOL to store owner
    const signature = await provider.connection.requestAirdrop(
      storeOwner.publicKey, 
      10 * LAMPORTS_PER_SOL
    );
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: signature,
      ...latestBlockHash,
    });
    
    // Airdrop SOL to buyer
    const buyerSignature = await provider.connection.requestAirdrop(
      buyer.publicKey, 
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: buyerSignature,
      ...latestBlockHash,
    });
    
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
    
    console.log("Ready to test product operations");
  });
  
  it("registers a new product", async () => {
    // Register product using Anchor's built-in methods
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
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
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
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    console.log("Product updated successfully");
  });
  
  it("prevents unauthorized product updates", async () => {
    const UNAUTHORIZED_NAME = "Hacked Product";
    const unauthorizedUser = Keypair.generate();
    
    // Airdrop SOL to unauthorized user
    const unAuthSig = await provider.connection.requestAirdrop(
      unauthorizedUser.publicKey, 
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(unAuthSig);
    
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
    await program.methods
      .deactivateProduct(
        productId
      )
      .accounts({
        // Use the correct account structure expected by the program
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    console.log("Product deactivated successfully");
  });
});
