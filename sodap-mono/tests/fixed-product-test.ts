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
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import * as token from "@solana/spl-token";

// Main test suite for the Sodap program product management
describe("sodap product management", () => {
  // Initialize provider and program instances
  const wallet = anchor.Wallet.local();
  const connection = new anchor.web3.Connection("http://localhost:8899", "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed", skipPreflight: true }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;

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

  // Helper function to create a new token mint and associated token account
  async function createMint(
    storeKeypair: Keypair
  ): Promise<[PublicKey, PublicKey]> {
    const payer = provider.wallet;
    const mintAuthority = payer.publicKey;
    const freezeAuthority = null;
    const decimals = 0;

    // Create a new mint
    const mintAccount = new Keypair();

    // Request an airdrop to pay for the transaction
    await requestAirdrop(payer.publicKey);

    const lamports =
      await provider.connection.getMinimumBalanceForRentExemption(
        token.MintLayout.span
      );

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      space: token.MintLayout.span,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    });

    const initMintInstruction = token.Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority
    );

    // Create associated token account owned by the store
    const associatedTokenAddress = await token.Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintAccount.publicKey,
      storeKeypair.publicKey
    );

    const createAssociatedTokenAccountInstruction =
      token.Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintAccount.publicKey,
        associatedTokenAddress,
        payer.publicKey,
        storeKeypair.publicKey
      );

    const transaction = new Transaction().add(
      createAccountInstruction,
      initMintInstruction,
      createAssociatedTokenAccountInstruction
    );

    // Include both the mint and store keypairs as signers
    await provider.sendAndConfirm(transaction, [mintAccount, storeKeypair]);

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

  // Test initialization of the program
  it("Is initialized!", async () => {
    // Make sure the wallet has enough SOL
    await requestAirdrop(provider.wallet.publicKey);
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        system_program: SystemProgram.programId
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  // Test product management
  it("registers a product", async () => {
    // Use the provider's wallet as the owner for simplicity
    const owner = provider.wallet.payer;
    const storeId = owner.publicKey;

    // Fund the owner account with SOL
    await requestAirdrop(owner.publicKey);

    // Find PDA for store account
    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeId.toBuffer()],
      program.programId
    );

    // Register store with test data - fixed account fields
    await program.methods
      .registerStore(
        storeId,
        "Test Store",
        "A test store for testing",
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
        authority: owner.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    // Generate product UUID with timestamp to ensure uniqueness
    const productUuidBytes = generateUniqueProductUuid();
    // Convert to array for PDA seed
    const productUuidArray = Array.from(productUuidBytes);

    // Find the PDA for the product with proper seeds
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), Buffer.from(productUuidBytes)],
      program.programId
    );

    // Create mint and token account
    const [mint, tokenAccount] = await createMint(owner);

    // Register product - fixed account structure with payer
    await program.methods
      .registerProduct(
        productUuidArray,
        new anchor.BN(100),
        new anchor.BN(10),
        { none: {} },
        "https://example.com/metadata.json"
      )
      .accounts({
        product: productPda,
        store: owner.publicKey,
        store_account: storePda,
        mint,
        tokenAccount,
        token_program: TOKEN_PROGRAM_ID,
        associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        payer: provider.wallet.publicKey
      })
      .rpc();

    // Verify product data
    const productAccount = await program.account.product.fetch(productPda);
    assert.equal(productAccount.price.toNumber(), 100);
    assert.equal(productAccount.stock.toNumber(), 10);
    assert.deepEqual(productAccount.tokenizedType, { none: {} });
    assert.equal(
      productAccount.metadataUri,
      "https://example.com/metadata.json"
    );
  });

  // Test product update functionality
  it("updates a product", async () => {
    // Use the provider's wallet as the owner for simplicity
    const owner = provider.wallet.payer;
    const storeId = owner.publicKey;

    // Fund the owner account with SOL
    await requestAirdrop(owner.publicKey);

    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeId.toBuffer()],
      program.programId
    );

    // First register the store - fixed account structure with payer
    await program.methods
      .registerStore(
        storeId,
        "Test Store",
        "A test store for testing",
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
        authority: owner.publicKey,
        payer: provider.wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc();

    // Generate product UUID with timestamp to ensure uniqueness
    const productUuidBytes = generateUniqueProductUuid();
    // Convert to array for PDA seed
    const productUuidArray = Array.from(productUuidBytes);

    // Find the PDA for the product with proper seeds
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), Buffer.from(productUuidBytes)],
      program.programId
    );

    // Create mint and token account
    const [mint, tokenAccount] = await createMint(owner);

    // Register initial product - fixed account structure with payer
    await program.methods
      .registerProduct(
        productUuidArray,
        new anchor.BN(100),
        new anchor.BN(10),
        { none: {} },
        "https://example.com/metadata.json"
      )
      .accounts({
        product: productPda,
        store: owner.publicKey,
        store_account: storePda,
        mint,
        tokenAccount,
        token_program: TOKEN_PROGRAM_ID,
        associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        payer: provider.wallet.publicKey
      })
      .rpc();

    // Update product - fixed account structure with payer
    await program.methods
      .updateProduct(
        productUuidArray,
        new anchor.BN(150),
        new anchor.BN(5),
        { discount: { percentage: new BN(10) } },
        "https://example.com/updated-metadata.json"
      )
      .accounts({
        product: productPda,
        store: owner.publicKey,
        system_program: SystemProgram.programId,
        payer: provider.wallet.publicKey
      })
      .rpc();

    // Verify updated product data
    const updatedProduct = await program.account.product.fetch(productPda);
    assert.equal(updatedProduct.price.toNumber(), 150);
    assert.equal(updatedProduct.stock.toNumber(), 5);
    assert.deepEqual(updatedProduct.tokenizedType, { 
      discount: { percentage: new BN(10) } 
    });
    assert.equal(
      updatedProduct.metadataUri,
      "https://example.com/updated-metadata.json"
    );
  });

  // Test product deactivation
  it("deactivates a product", async () => {
    // Use the provider's wallet as the owner for simplicity
    const owner = provider.wallet.payer;
    const storeId = owner.publicKey;

    // Fund the owner account with SOL
    await requestAirdrop(owner.publicKey);

    const [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeId.toBuffer()],
      program.programId
    );

    // First register the store - fixed account structure with payer
    await program.methods
      .registerStore(
        storeId,
        "Test Store",
        "A test store for testing",
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
        authority: owner.publicKey,
        payer: provider.wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc();

    // Generate product UUID with timestamp to ensure uniqueness
    const productUuidBytes = generateUniqueProductUuid();
    // Convert to array for PDA seed
    const productUuidArray = Array.from(productUuidBytes);

    // Find the PDA for the product with proper seeds
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), Buffer.from(productUuidBytes)],
      program.programId
    );

    // Create mint and token account
    const [mint, tokenAccount] = await createMint(owner);

    // Register initial product - fixed account structure with payer
    await program.methods
      .registerProduct(
        productUuidArray,
        new anchor.BN(100),
        new anchor.BN(10),
        { none: {} },
        "https://example.com/metadata.json"
      )
      .accounts({
        product: productPda,
        store: owner.publicKey,
        store_account: storePda,
        mint,
        tokenAccount,
        token_program: TOKEN_PROGRAM_ID,
        associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        payer: provider.wallet.publicKey
      })
      .rpc();

    // Make sure product is active initially
    let productAccount = await program.account.product.fetch(productPda);
    assert.equal(productAccount.isActive, true);

    // Deactivate product - fixed account structure with payer
    await program.methods
      .deactivateProduct(productUuidArray)
      .accounts({
        product: productPda,
        store: owner.publicKey,
        system_program: SystemProgram.programId,
        payer: provider.wallet.publicKey
      })
      .rpc();

    // Verify product is now inactive
    productAccount = await program.account.product.fetch(productPda);
    assert.equal(productAccount.isActive, false);
  });
});
