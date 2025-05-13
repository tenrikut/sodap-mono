// Script to test the Anchor program functionality
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// Configure the client to use the local cluster
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// Load the program
const program = anchor.workspace.Sodap as Program<Sodap>;

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

// Main function to test the program
async function testAnchorProgram() {
  console.log("Testing Anchor program functionality...");
  
  try {
    // Create keypairs for different test entities
    const storeOwner = Keypair.generate();
    const buyer = provider.wallet.payer;
    
    console.log("Store owner public key:", storeOwner.publicKey.toString());
    console.log("Buyer public key:", buyer.publicKey.toString());
    
    // Fund the test accounts
    console.log("Funding test accounts...");
    await requestAirdrop(storeOwner.publicKey);
    
    // Initialize the program
    console.log("Initializing the program...");
    const initTx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    console.log("Initialization transaction signature:", initTx);
    
    // Find the store PDA
    const [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );
    console.log("Store PDA:", storePda.toString());
    
    // Create store with loyalty program
    console.log("Registering a new store...");
    const loyaltyConfig = {
      pointsPerDollar: new BN(100), // 100 points per dollar spent
      redemptionRate: new BN(10), // 10 points = $0.01
    };
    
    try {
      const storeTx = await program.methods
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
      
      console.log("Store registration transaction signature:", storeTx);
      
      // Fetch and display store data
      const storeAccount = await program.account.store.fetch(storePda);
      console.log("Store data:", {
        name: storeAccount.name,
        owner: storeAccount.owner.toString(),
        isActive: storeAccount.isActive,
      });
    } catch (error) {
      console.error("Error registering store:", error);
    }
    
    // Generate a product ID
    const productId = Keypair.generate();
    console.log("Product ID:", productId.publicKey.toString());
    
    // Find the product PDA
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), productId.publicKey.toBuffer()],
      program.programId
    );
    console.log("Product PDA:", productPda.toString());
    
    // Register a product
    console.log("Registering a product...");
    const attributes = [
      { name: "Color", value: "Red" },
      { name: "Size", value: "Medium" },
    ];
    
    try {
      const productTx = await program.methods
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
      
      console.log("Product registration transaction signature:", productTx);
      
      // Fetch and display product data
      const productAccount = await program.account.product.fetch(productPda);
      console.log("Product data:", {
        name: productAccount.name,
        price: productAccount.price.toString(),
        stock: productAccount.stock.toString(),
        isActive: productAccount.isActive,
      });
    } catch (error) {
      console.error("Error registering product:", error);
    }
    
    console.log("Anchor program testing completed successfully!");
  } catch (error) {
    console.error("Error testing Anchor program:", error);
  }
}

// Run the test
testAnchorProgram().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
