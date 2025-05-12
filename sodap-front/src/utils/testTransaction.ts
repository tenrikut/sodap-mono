import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { toast } from "sonner";
import type { Sodap } from "@/idl/sodap";

/**
 * Test transaction to initialize the program
 * This is a simple call to the program's initialize instruction
 */
export const testInitializeTransaction = async (
  program: Program<Sodap>,
  walletPublicKey: PublicKey
): Promise<string> => {
  try {
    console.log("Creating initialize transaction...");
    console.log("Using program ID:", program.programId.toString());
    console.log("With wallet:", walletPublicKey.toString());

    // Create the transaction
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: walletPublicKey,
        // other accounts you need to specify
        // No need to specify systemProgram explicitly as Anchor adds it automatically
      })
      .rpc();

    console.log("Transaction sent successfully!");
    return tx;
  } catch (error: unknown) {
    console.error("Error creating initialize transaction:", error);
    throw error;
  }
};

/**
 * Test user profile creation
 * This calls the createOrUpdateUserProfile instruction
 */
export const testCreateUserProfile = async (
  program: Program<Sodap>,
  walletPublicKey: PublicKey,
  name: string,
  email: string
): Promise<string> => {
  try {
    console.log("Creating user profile transaction...");

    // Create the transaction
    const tx = await program.methods
      .createOrUpdateUserProfile(
        null, // userId (optional)
        name,
        email,
        null // phone (optional)
      )
      .accounts({
        payer: walletPublicKey,
        // Don't specify systemProgram manually as it's already defined in your IDL
      })
      .rpc();

    console.log("User profile created successfully!");
    return tx;
  } catch (error: unknown) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};
