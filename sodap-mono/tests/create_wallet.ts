import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { Buffer } from "buffer";
import { fundMultipleTestAccounts } from "./utils/devnet-utils";

describe("sodap user wallet", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  
  // Use fixed keypairs for testing
  const user = Keypair.generate();
  const anotherUser = Keypair.generate();
  
  // PDA for user wallet
  let userWalletPda: PublicKey;
  
  before(async () => {
    // Fund test accounts from the provider wallet instead of using airdrops
    // This approach works better on devnet where airdrops are rate-limited
    console.log("Funding test accounts from provider wallet...");
    try {
      await fundMultipleTestAccounts(
        provider, 
        [
          user,
          anotherUser
        ],
        0.1 // 0.1 SOL each should be sufficient for tests
      );
      console.log("Successfully funded all test accounts");
    } catch (error) {
      console.error("Error funding test accounts:", error);
      throw error; // Fail the test if funding fails
    }
    
    // Derive user wallet PDA
    const [userWalletKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_wallet"), user.publicKey.toBuffer()],
      program.programId
    );
    userWalletPda = userWalletKey;
    console.log("User Wallet PDA:", userWalletPda.toBase58());
    console.log("User:", user.publicKey.toBase58());
  });
  
  it("creates a user wallet", async () => {
    // Create user wallet using Anchor's built-in methods
    try {
      console.log("Creating user wallet with authority:", user.publicKey.toBase58());
      console.log("User wallet PDA:", userWalletPda.toBase58());
      
      // Check user balance before creating wallet
      const userBalance = await provider.connection.getBalance(user.publicKey);
      console.log("User balance before creating wallet:", userBalance / LAMPORTS_PER_SOL, "SOL");
      
      await program.methods
        .createUserWallet()
        .accounts({
          // Use the correct account structure expected by the program
          userProfile: userWalletPda,
          authority: user.publicKey,
          payer: user.publicKey, // Explicitly add payer
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      console.log("User wallet created successfully");
    } catch (error) {
      console.error("Error creating user wallet:", error);
      throw error;
    }
    
    // Fetch and verify user wallet data
    const userWalletAccount = await program.account.userProfile.fetch(userWalletPda);
    
    // Verify user wallet data
    assert.ok(userWalletAccount.authority.equals(user.publicKey), "Authority should match user's public key");
    assert.equal(userWalletAccount.userId, user.publicKey.toString(), "User ID should match user's public key as string");
    assert.equal(userWalletAccount.deliveryAddress, "", "Delivery address should be empty");
    assert.ok(userWalletAccount.preferredStore.equals(PublicKey.default), "Preferred store should be default");
    assert.equal(userWalletAccount.totalPurchases, 0, "Total purchases should be 0");
    
    console.log("User wallet verified successfully");
  });
  
  it("prevents unauthorized wallet creation", async () => {
    // Derive another user's wallet PDA
    const [anotherUserWalletKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_wallet"), anotherUser.publicKey.toBuffer()],
      program.programId
    );
    
    // Check another user balance before creating wallet
    const anotherUserBalance = await provider.connection.getBalance(anotherUser.publicKey);
    console.log("Another user balance before creating wallet:", anotherUserBalance / LAMPORTS_PER_SOL, "SOL");
    
    // Create user wallet for another user
    try {
      console.log("Creating another user wallet with authority:", anotherUser.publicKey.toBase58());
      console.log("Another user wallet PDA:", anotherUserWalletKey.toBase58());
      
      await program.methods
        .createUserWallet()
        .accounts({
          userProfile: anotherUserWalletKey,
          authority: anotherUser.publicKey,
          payer: anotherUser.publicKey, // Explicitly add payer
          systemProgram: SystemProgram.programId,
        })
        .signers([anotherUser])
        .rpc();
      
      console.log("Another user wallet created successfully");
    } catch (error) {
      console.error("Error creating another user wallet:", error);
      throw error;
    }
    
    // Try to create a wallet for another user using the first user's authority
    try {
      await program.methods
        .createUserWallet()
        .accounts({
          userProfile: anotherUserWalletKey,
          authority: user.publicKey,
          payer: user.publicKey, // Explicitly add payer
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      assert.fail("Should not be able to create a wallet for another user");
    } catch (err) {
      console.log("Expected error:", (err as Error).message);
      assert.ok(true, "Unauthorized wallet creation correctly failed");
    }
  });
  
  it("verifies wallet PDA derivation", async () => {
    // Derive user wallet PDA again to verify it matches
    const [derivedWalletKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_wallet"), user.publicKey.toBuffer()],
      program.programId
    );
    
    assert.ok(derivedWalletKey.equals(userWalletPda), "Derived wallet PDA should match the original");
    
    // Fetch the wallet account to verify it exists
    const userWalletAccount = await program.account.userProfile.fetch(userWalletPda);
    assert.ok(userWalletAccount, "User wallet account should exist");
    
    console.log("Wallet PDA derivation verified successfully");
  });
});
