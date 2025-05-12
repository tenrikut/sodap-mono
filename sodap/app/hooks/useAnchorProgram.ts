import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@project-serum/anchor";
import { PROGRAM_ID } from "../utils/solana";
import { useMemo } from "react";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet || !connection) return null;

    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
    });

    // Load the program IDL (this should be done once and cached)
    const idl = require("../../target/idl/sodap.json");
    return new Program(idl, PROGRAM_ID, provider);
  }, [connection, wallet]);
}
