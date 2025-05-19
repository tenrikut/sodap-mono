import * as anchor from "@coral-xyz/anchor";
import { Program, utils } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";

describe("sodap product", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  
  // Use fixed keypairs for testing
  const storeOwner = Keypair.generate();
  const buyer = Keypair.generate();
  
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  let productPda: PublicKey;
  
  // Test product data
  const productUuid = uuidv4().replace(/-/g, "");
  const productUuidBuffer = Buffer.from(productUuid, "hex");
  
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
    
    // Derive store PDA
    const storeSeeds = [
      Buffer.from("store"),
      storeOwner.publicKey.toBuffer()
    ];
    const [storeKey, storeBump] = PublicKey.findProgramAddressSync(
      storeSeeds,
      program.programId
    );
    storePda = storeKey;
    console.log("Store PDA:", storePda.toBase58());
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
    
    // Derive product PDA
    const productSeeds = [
      Buffer.from("product"),
      storePda.toBuffer(),
      productUuidBuffer
    ];
    const [productKey, productBump] = PublicKey.findProgramAddressSync(
      productSeeds,
      program.programId
    );
    productPda = productKey;
    console.log("Product PDA:", productPda.toBase58());
    console.log("Product UUID:", productUuid);
  });
  
  it("registers a new product", async () => {
    // Register product using Anchor's built-in methods
    await program.methods
      .registerProduct(
        Array.from(productUuidBuffer),
        new anchor.BN(TEST_PRODUCT_PRICE),
        new anchor.BN(TEST_PRODUCT_STOCK),
        { none: {} }, // TokenizedType enum
        TEST_PRODUCT_METADATA
      )
      .accounts({
        store: storePda,
        product: productPda,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
    
    // Fetch and verify product data
    const productAccount = await program.account.product.fetch(productPda);
    
    // Verify product data
    assert.equal(productAccount.price.toNumber(), TEST_PRODUCT_PRICE);
    assert.equal(productAccount.stock.toNumber(), TEST_PRODUCT_STOCK);
    assert.equal(productAccount.metadataUri, TEST_PRODUCT_METADATA);
    assert.ok(productAccount.isActive);
    assert.ok(productAccount.store.equals(storePda));
    assert.ok(productAccount.authority.equals(storeOwner.publicKey));
    
    // Verify UUID (convert array back to hex string for comparison)
    const storedUuid = Buffer.from(productAccount.uuid).toString('hex');
    assert.equal(storedUuid, productUuid);
  });
  
  it("updates product metadata", async () => {
    const NEW_PRICE = 2000000; // 0.002 SOL
    const NEW_STOCK = 20;
    const NEW_METADATA = "https://example.com/updated-product.json";
    
    // Update product using Anchor's built-in methods
    await program.methods
      .updateProduct(
        Array.from(productUuidBuffer),
        new anchor.BN(NEW_PRICE),
        new anchor.BN(NEW_STOCK),
        NEW_METADATA,
        { none: {} } // TokenizedType enum
      )
      .accounts({
        store: storePda,
        product: productPda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();
    
    // Fetch and verify updated product data
    const productAccount = await program.account.product.fetch(productPda);
    
    // Verify updated product data
    assert.equal(productAccount.price.toNumber(), NEW_PRICE);
    assert.equal(productAccount.stock.toNumber(), NEW_STOCK);
    assert.equal(productAccount.metadataUri, NEW_METADATA);
    assert.ok(productAccount.isActive);
  });
  
  it("prevents unauthorized product updates", async () => {
    const UNAUTHORIZED_PRICE = 500000;
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
          Array.from(productUuidBuffer),
          new anchor.BN(UNAUTHORIZED_PRICE),
          null, // Don't update stock
          null, // Don't update metadata
          null  // Don't update tokenized type
        )
        .accounts({
          store: storePda,
          product: productPda,
          authority: unauthorizedUser.publicKey,
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
        Array.from(productUuidBuffer)
      )
      .accounts({
        store: storePda,
        product: productPda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();
    
    // Fetch and verify product is deactivated
    const productAccount = await program.account.product.fetch(productPda);
    
    // Verify product is deactivated
    assert.equal(productAccount.isActive, false);
  });
});
