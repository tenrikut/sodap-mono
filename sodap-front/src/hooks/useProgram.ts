import { useMemo } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/sodap.json";
import { Sodap } from "../idl/sodap";
import { Keypair, PublicKey } from "@solana/web3.js";

// The program ID should match the one in your Solana program deployment
const PROGRAM_ID = new PublicKey(
  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet || !connection) return null;

    // Create a proper AnchorProvider-compatible wallet adapter
    const anchorWallet = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
      // Add missing payer property needed by Anchor
      get payer() {
        const keypair = Keypair.generate();
        // Override the keypair's publicKey getter to return wallet's publicKey
        Object.defineProperty(keypair, "publicKey", {
          get: () => wallet.publicKey,
        });
        return keypair;
      },
    };

    const provider = new AnchorProvider(connection, anchorWallet, {
      commitment: "confirmed",
      skipPreflight: true,
    });

    // Initialize program with correct parameter order for v0.31.1
    // IDL, programId, provider is the correct order
    return new Program<Sodap>(idl as Idl, PROGRAM_ID, provider);
  }, [wallet, connection]);

  return { program };
}
