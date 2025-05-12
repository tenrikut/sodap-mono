import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useCallback, useState } from "react";
import { useProgram } from "../../../sodap-front/src/hooks/useProgram";

export const useWalletAndStore = () => {
  useConnection(); // Keep the hook for side effects but don't destructure connection
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUserWallet = useCallback(async () => {
    if (!publicKey || !program) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const [userProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_wallet"), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .createUserWallet()
        .accounts({
          userProfile: userProfilePDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        userProfilePDA: userProfilePDA.toString(),
        transaction: tx,
      };
    } catch (err) {
      console.error("Error creating user wallet:", err);
      setError("Failed to create user wallet");
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, program]);

  const getStorePDA = useCallback(async () => {
    if (!publicKey || !program) {
      setError("Wallet not connected");
      return null;
    }

    try {
      const [storePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("store"), publicKey.toBuffer()],
        program.programId
      );

      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), storePDA.toBuffer()],
        program.programId
      );

      return {
        storePDA: storePDA.toString(),
        escrowPDA: escrowPDA.toString(),
      };
    } catch (err) {
      console.error("Error getting store PDA:", err);
      setError("Failed to get store PDA");
      return null;
    }
  }, [publicKey, program]);

  return {
    createUserWallet,
    getStorePDA,
    loading,
    error,
  };
};
