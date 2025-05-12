import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { getSolanaConfig } from "./solana";

export const SODAP_PROGRAM_ID = new PublicKey(
  getSolanaConfig().programId || "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (!wallet || !connection) return;

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as WalletContextState,
        {
          commitment: "confirmed",
        }
      );

      // Initialize the program (you'll need to import your IDL)
      // const program = new Program(IDL, SODAP_PROGRAM_ID, provider);
      // setProgram(program);
    } catch (error) {
      console.error("Failed to initialize Anchor program:", error);
    }
  }, [wallet, connection]);

  return program;
}

export type TransactionResult = {
  signature: string;
  error?: string;
};
