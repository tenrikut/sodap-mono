import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Buffer } from "buffer";

// Your program ID - update this with your actual program ID
export const PROGRAM_ID = new PublicKey(
  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

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
 * Find a Product PDA by UUID
 */
export function findProductPDA(
  storePubkey: PublicKey,
  productUuid: string
): PublicKey {
  const productUuidBytes = uuidToBytes(productUuid);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("product"), storePubkey.toBuffer(), productUuidBytes],
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
 * Convert lamports to SOL (as a number)
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return sol * 1_000_000_000;
}
