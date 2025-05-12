import { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../hooks/useProgram";

export const WalletAndStorePDA: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [storePDA, setStorePDA] = useState<string | null>(null);
  const [userWallet, setUserWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUserWallet = async () => {
    if (!publicKey || !program) return;

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

      setUserWallet(userProfilePDA.toString());
      console.log("Created user wallet:", tx);
    } catch (err) {
      console.error("Error creating user wallet:", err);
      setError("Failed to create user wallet");
    } finally {
      setLoading(false);
    }
  };

  const findStorePDA = async () => {
    if (!publicKey || !program) return;

    try {
      setLoading(true);
      setError(null);

      const [storePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("store"), publicKey.toBuffer()],
        program.programId
      );

      setStorePDA(storePDA.toString());
    } catch (err) {
      console.error("Error finding store PDA:", err);
      setError("Failed to find store PDA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Wallet & Store Management</h2>

      <div className="space-y-2">
        <button
          onClick={createUserWallet}
          disabled={loading || !publicKey}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? "Creating..." : "Create User Wallet"}
        </button>

        <button
          onClick={findStorePDA}
          disabled={loading || !publicKey}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? "Finding..." : "Find Store PDA"}
        </button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {userWallet && (
        <div className="bg-gray-100 p-2 rounded">
          <p className="font-semibold">User Wallet:</p>
          <p className="break-all">{userWallet}</p>
        </div>
      )}

      {storePDA && (
        <div className="bg-gray-100 p-2 rounded">
          <p className="font-semibold">Store PDA:</p>
          <p className="break-all">{storePDA}</p>
        </div>
      )}
    </div>
  );
};
