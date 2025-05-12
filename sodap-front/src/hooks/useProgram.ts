import { useMemo } from "react";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/sodap.json";
import { SodapProgram } from "../idl/sodap_types";

// The program ID should match the one in your Solana program deployment
const PROGRAM_ID = new web3.PublicKey(
  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet || !connection) return null;

    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
      skipPreflight: true,
    });

    return new Program(
      idl as any,
      PROGRAM_ID,
      provider
    ) as Program<SodapProgram>;
  }, [connection, wallet]);

  return { program };
}
