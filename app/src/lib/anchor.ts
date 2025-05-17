import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { getSolanaConfig } from "./solana";
import { IDL } from "../idl";
import type { Idl } from "../idl";

export const SODAP_PROGRAM_ID = new PublicKey(
  getSolanaConfig().programId || "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Idl> | null>(null);

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

      // Initialize the program
      // Initialize the program with the correct provider
      // Set the provider globally
      setProvider(provider);

      // Initialize the program with just the IDL
      // Note: IDL must include the program address
      const program = new Program<Idl>(IDL);
      // Note: In newer versions of Anchor, the programId is expected to be in the IDL
      setProgram(program);
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
