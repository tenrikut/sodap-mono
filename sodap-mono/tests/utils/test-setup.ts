import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../../target/types/sodap";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export async function setupTest() {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program
  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Generate a new key pair for testing
  const testUser = Keypair.generate();

  // Airdrop some SOL for testing
  const signature = await provider.connection.requestAirdrop(
    testUser.publicKey,
    2 * LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(signature);

  return {
    program,
    provider,
    testUser,
  };
}

export function createKeypair(): Keypair {
  return Keypair.generate();
}

export async function airdropSol(
  connection: anchor.web3.Connection,
  to: PublicKey,
  amount: number = 2
): Promise<void> {
  const signature = await connection.requestAirdrop(
    to,
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
}
