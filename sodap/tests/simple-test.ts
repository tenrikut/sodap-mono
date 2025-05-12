// @ts-nocheck - Disable TypeScript checking for this file due to Anchor-generated type mismatches

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

// Main test suite for the Sodap program
describe("sodap", () => {
  // Initialize provider and program instances
  // Create a custom provider that can handle multiple signers
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

  // Test initialization of the program
  it("Is initialized!", async () => {
    // Make sure the wallet has enough SOL
    await requestAirdrop(provider.wallet.publicKey);
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
