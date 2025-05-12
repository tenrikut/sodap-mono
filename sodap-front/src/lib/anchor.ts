import {
  Program,
  AnchorProvider,
  type Wallet as AnchorWallet,
} from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getSolanaConfig } from "./solana";
import type { Sodap } from "../idl/sodap";
// Import directly with type assertion
const sodapIdl = require("../idl/sodap.json");

export const SODAP_PROGRAM_ID = new PublicKey(
  getSolanaConfig().programId || "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Sodap> | null>(null);

  useEffect(() => {
    if (
      !wallet?.publicKey ||
      !connection ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      return;
    }

    try {
      // Create provider with properly typed wallet
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
        } as AnchorWallet,
        { commitment: "confirmed" }
      );

      // Initialize Program instance with workspace pattern from tests
      const program = new Program(sodapIdl, SODAP_PROGRAM_ID, provider);
      setProgram(program as Program<Sodap>);
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
