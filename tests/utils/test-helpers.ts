import { PublicKey } from "@solana/web3.js";

export function findPDA(
  seeds: Buffer[],
  programId: PublicKey
): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programId);
  return [pda, bump];
}

export function findStorePDA(
  programId: PublicKey,
  storeOwner: PublicKey
): [PublicKey, number] {
  return findPDA([Buffer.from("store"), storeOwner.toBuffer()], programId);
}
