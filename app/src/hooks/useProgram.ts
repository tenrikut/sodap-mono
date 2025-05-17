import { useMemo } from "react";
import { AnchorProvider, Program, setProvider, Idl } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/sodap.json";
import { Sodap } from "../idl/sodap";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !connection) return null;

    // 1. Create and register the provider
    // Provider options are now optional in v0.30+
    const provider = new AnchorProvider(connection, wallet);
    setProvider(provider);

    // 2. Instantiate the program with the IDL
    // Note: Make sure your IDL JSON includes the "address" field
    // In v0.30+, program ID comes from IDL's address field
    return new Program(idl) as Program<Sodap>;
  }, [connection, wallet]);

  return { program };
}
