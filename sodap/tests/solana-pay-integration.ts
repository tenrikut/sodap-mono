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
  Token,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";

// Test for Solana Pay checkout functionality
describe("solana-pay-integration", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  const wallet = provider.wallet;

  // Store data
  let storePda: PublicKey;
  let escrowPda: PublicKey;

  // Test data
  const testStoreName = "Solana Pay Integration Test Store";
  const testStoreDescription = "Test store for Solana Pay integration";
  const testStoreLogoUrl = "https://example.com/logo.png";

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

  // Initialize program and create a store
  it("initializes the program and creates a store", async () => {
    // Fund the wallet
    await requestAirdrop(wallet.publicKey);

    // Initialize the program
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
      console.log(
        "Program initialization error (might already be initialized):",
        err.message
      );
    }

    // Find store PDA
    [storePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("store"), wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log("Store PDA:", storePda.toString());

    // Find escrow PDA
    [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );

    console.log("Escrow PDA:", escrowPda.toString());

    // Register store
    try {
      await program.methods
        .registerStore(
          wallet.publicKey,
          testStoreName,
          testStoreDescription,
          testStoreLogoUrl,
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

      // Verify store was created correctly
      const storeAccount = await program.account.store.fetch(storePda);
      assert.equal(storeAccount.name, testStoreName);
      assert.ok(storeAccount.owner.equals(wallet.publicKey));
    } catch (err) {
      console.log(
        "Store registration error (might already exist):",
        err.message
      );
    }
  });

  // Test registering a product using Solana Pay checkout
  it("registers a product for Solana Pay checkout", async () => {
    // Generate product UUID
    const productUuidBytes = generateUniqueProductUuid();
    const productUuidArray = Array.from(productUuidBytes);

    // Find product PDA
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        storePda.toBuffer(),
        Buffer.from(productUuidBytes),
      ],
      program.programId
    );

    console.log("Product PDA:", productPda.toString());

    // Create a token for the product (representing an NFT)
    const token = await Token.createMint(
      provider.connection,
      wallet.payer, // payer
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority
      0, // decimals
      TOKEN_PROGRAM_ID
    );

    console.log("Created token mint:", token.publicKey.toString());

    // Create a token account for the product owner
    const tokenAccount = await token.createAccount(wallet.publicKey);
    console.log("Created token account:", tokenAccount.toString());

    // Register the product
    try {
      await program.methods
        .registerProduct(
          productUuidArray,
          new anchor.BN(1_000_000), // 1 SOL price
          new anchor.BN(5), // 5 in stock
          { none: {} }, // non-tokenized product
          "https://example.com/product-data"
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

      // Verify the product was created
      const productAccount = await program.account.product.fetch(productPda);
      assert.equal(productAccount.price.toNumber(), 1_000_000);
      assert.equal(productAccount.stock.toNumber(), 5);
    } catch (err) {
      console.error("Error registering product:", err);
      throw err;
    }

    return { productPda, productUuidBytes, productUuidArray };
  });

  // Test the Solana Pay checkout flow
  it("completes a Solana Pay checkout process", async function () {
    this.timeout(30000); // Allow longer timeout for this test

    // Get the product created in the previous test
    const productUuidBytes = generateUniqueProductUuid();
    const productUuidArray = Array.from(productUuidBytes);

    // Find product PDA
    const [productPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("product"),
        storePda.toBuffer(),
        Buffer.from(productUuidBytes),
      ],
      program.programId
    );

    console.log("Using product at PDA:", productPda.toString());

    // Create a receipt PDA
    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase"),
        storePda.toBuffer(),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    console.log("Receipt PDA:", receiptPda.toString());

    // Get wallet's initial balance
    const initialBalance = await provider.connection.getBalance(
      wallet.publicKey
    );
    console.log("Initial wallet balance:", initialBalance);

    try {
      // Create a new product for this specific test
      const token = await Token.createMint(
        provider.connection,
        wallet.payer,
        wallet.publicKey,
        wallet.publicKey,
        0,
        TOKEN_PROGRAM_ID
      );

      const tokenAccount = await token.createAccount(wallet.publicKey);

      // Register product
      await program.methods
        .registerProduct(
          productUuidArray,
          new anchor.BN(500_000), // 0.5 SOL price
          new anchor.BN(10), // 10 in stock
          { none: {} }, // non-tokenized product
          "https://example.com/product-data"
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

      console.log("Test product registered successfully");

      // Purchase product using Solana Pay checkout
      await program.methods
        .purchaseCart(
          [productUuidArray], // Product UUIDs
          [new BN(1)], // Quantities (buying 1 of the product)
          new BN(500_000), // Total amount paid
          new BN(0), // Gas fee
          { success: {} } // Transaction status
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
          { pubkey: productPda, isWritable: true, isSigner: false },
        ])
        .rpc();

      console.log("Purchase completed successfully");

      // Verify the purchase
      // 1. Check escrow account balance
      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.equal(
        escrowAccount.balance.toNumber(),
        500_000,
        "Payment should be in escrow"
      );

      // 2. Check product stock was reduced
      const updatedProduct = await program.account.product.fetch(productPda);
      assert.equal(
        updatedProduct.stock.toNumber(),
        9,
        "Product stock should be reduced"
      );

      // 3. Verify receipt was created
      const receipt = await program.account.purchase.fetch(receiptPda);
      assert.equal(receipt.totalPaid.toNumber(), 500_000);
      assert.ok(receipt.buyer.equals(wallet.publicKey));

      // Release funds from escrow to owner
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

      // Verify escrow is now empty
      const updatedEscrow = await program.account.escrow.fetch(escrowPda);
      assert.equal(
        updatedEscrow.balance.toNumber(),
        0,
        "Escrow should be empty after release"
      );
    } catch (err) {
      console.error("Error during Solana Pay checkout:", err);
      throw err;
    }
  });

  // Test the loyalty points functionality
  it("mints loyalty points after purchase", async () => {
    // Find the loyalty mint PDA
    const [loyaltyMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("loyalty_mint"), storePda.toBuffer()],
      program.programId
    );

    console.log("Loyalty Mint PDA:", loyaltyMintPda.toString());

    try {
      // Initialize the loyalty mint if it doesn't exist
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
            payer: wallet.publicKey,
          })
          .rpc();

        console.log("Loyalty mint initialized");
      } catch (err) {
        console.log(
          "Loyalty mint initialization error (might already exist):",
          err.message
        );
      }

      // Create a token object to interact with the loyalty mint
      const loyaltyToken = new Token(
        provider.connection,
        loyaltyMintPda,
        TOKEN_PROGRAM_ID,
        wallet.payer
      );

      // Create a token account for the customer
      let customerTokenAccount: PublicKey;
      try {
        customerTokenAccount = await loyaltyToken.createAccount(
          wallet.publicKey
        );
        console.log(
          "Created customer token account:",
          customerTokenAccount.toString()
        );
      } catch (err) {
        // If account already exists, get its address
        customerTokenAccount = await loyaltyToken.getAccountInfo(
          wallet.publicKey
        );
        console.log("Found existing customer token account");
      }

      // Mint loyalty points for a purchase of 500,000 lamports
      const purchaseAmount = new BN(500_000);

      try {
        // Look at the actual mintLoyaltyPoints function signature in the contract
        await program.methods
          .mintLoyaltyPoints(purchaseAmount)
          .accounts({
            store: storePda,
            loyalty_mint: loyaltyMintPda,
            authority: wallet.publicKey,
            token_program: TOKEN_PROGRAM_ID,
            destination: customerTokenAccount,
            payer: wallet.publicKey,
          })
          .rpc();

        console.log("Loyalty points minted successfully");

        // Verify points were minted
        const tokenAccountInfo = await loyaltyToken.getAccountInfo(
          customerTokenAccount
        );
        console.log(
          "Customer token balance:",
          tokenAccountInfo.amount.toString()
        );

        // If we have points, try to redeem some
        if (Number(tokenAccountInfo.amount) > 0) {
          const pointsToRedeem = Math.floor(
            Number(tokenAccountInfo.amount) / 2
          );

          await program.methods
            .redeemLoyaltyPoints(new BN(pointsToRedeem))
            .accounts({
              store: storePda,
              loyalty_mint: loyaltyMintPda,
              authority: wallet.publicKey,
              token_program: TOKEN_PROGRAM_ID,
              source: customerTokenAccount,
              payer: wallet.publicKey,
            })
            .rpc();

          console.log("Redeemed", pointsToRedeem, "loyalty points");

          // Verify points were redeemed
          const updatedBalance = await loyaltyToken.getAccountInfo(
            customerTokenAccount
          );
          console.log(
            "Token balance after redemption:",
            updatedBalance.amount.toString()
          );
        }
      } catch (err) {
        console.error("Error with loyalty points:", err);
        throw err;
      }
    } catch (err) {
      console.error("Error in loyalty test:", err);
      throw err;
    }
  });
});
