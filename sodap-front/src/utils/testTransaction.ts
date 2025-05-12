import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import { toast } from "sonner";
import { IDL } from "../idl";

/**
 * Test transaction to initialize the program
 * This is a simple call to the program's initialize instruction
 */
export const testInitializeTransaction = async (
  program: Program,
  wallet: PublicKey
): Promise<string> => {
  try {
    console.log("Creating initialize transaction...");
    console.log("Using program ID:", program.programId.toString());
    console.log("With wallet:", wallet.toString());

    // Create the transaction
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: wallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction sent successfully!");
    return tx;
  } catch (error: any) {
    console.error("Error creating initialize transaction:", error);
    throw error;
  }
};

/**
 * Test user profile creation
 * This calls the createOrUpdateUserProfile instruction
 */
export const testCreateUserProfile = async (
  program: Program,
  wallet: PublicKey,
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
        payer: wallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("User profile created successfully!");
    return tx;
  } catch (error: any) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};
