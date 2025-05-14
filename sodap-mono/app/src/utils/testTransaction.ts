import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program, IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { Sodap } from "../idl/sodap";
import { toast } from "sonner";
import { IDL } from "../idl";

/**
 * Test transaction to initialize the program
 * This is a simple call to the program's initialize instruction
 */
export const testInitializeTransaction = async (
  program: Program<Sodap>,
  wallet: PublicKey
): Promise<string> => {
  try {
    console.log("Creating initialize transaction...");
    console.log("Using program ID:", program.programId.toString());
    console.log("With wallet:", wallet.toString());

    // Create the transaction
    const tx = await program.methods
      .initialize()
      // Use the new accounts() builder that only requires non-resolvable accounts
      .accounts({
        payer: wallet
      })
      .rpc();

    console.log("Transaction sent successfully!");
    return tx;
  } catch (error: unknown) {
    console.error("Error creating initialize transaction:", error);
    if (error instanceof Error) {
      throw new Error(`Initialize transaction failed: ${error.message}`);
    }
    throw new Error("Initialize transaction failed with unknown error");
  }
};

/**
 * Test user profile creation
 * This calls the createOrUpdateUserProfile instruction
 */
export const testCreateUserProfile = async (
  program: Program<Sodap>,
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
      // Use the new accounts() builder that only requires non-resolvable accounts
      .accounts({
        payer: wallet
      })
      .rpc();

    console.log("User profile created successfully!");
    return tx;
  } catch (error: unknown) {
    console.error("Error creating user profile:", error);
    if (error instanceof Error) {
      throw new Error(`User profile creation failed: ${error.message}`);
    }
    throw new Error("User profile creation failed with unknown error");
  }
};
