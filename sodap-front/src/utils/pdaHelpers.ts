import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { PROGRAM_ID } from "./anchor";

/**
 * Convert a string UUID to Uint8Array for use in PDAs
 */
export function uuidToBytes(uuid: string): Uint8Array {
  // Remove hyphens and convert to buffer
  const hex = uuid.replace(/-/g, "");
  const bytes = Buffer.from(hex, "hex");
  return bytes;
}

/**
 * Find the Store PDA for a given owner
 */
export function findStorePDA(ownerPubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("store"), ownerPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Escrow PDA for a given store
 */
export function findEscrowPDA(storePubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), storePubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Receipt PDA for a purchase
 */
export function findReceiptPDA(
  storePubkey: PublicKey,
  buyerPubkey: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("purchase"), storePubkey.toBuffer(), buyerPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Loyalty Mint PDA for a store
 */
export function findLoyaltyMintPDA(storePubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loyalty_mint"), storePubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Watch Purchase PDA for a purchase of a watch
 * Specialized PDA for the Sodap Watch Store (store ID 5)
 */
export function findWatchPurchasePDA(
  storePubkey: PublicKey,
  buyerPubkey: PublicKey,
  watchId: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("watch_purchase"),
      storePubkey.toBuffer(),
      buyerPubkey.toBuffer(),
      Buffer.from(watchId),
    ],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Watch Warranty PDA for a purchased watch
 * Creates a warranty record for watches from Sodap Watch Store
 */
export function findWatchWarrantyPDA(
  storePubkey: PublicKey,
  buyerPubkey: PublicKey,
  watchId: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("watch_warranty"),
      storePubkey.toBuffer(),
      buyerPubkey.toBuffer(),
      Buffer.from(watchId),
    ],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Convert lamports to SOL (as a number)
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}
