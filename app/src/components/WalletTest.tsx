import React, { useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAnchor } from "../hooks/useAnchor";
import {
  testInitializeTransaction,
  testCreateUserProfile,
} from "../utils/testTransaction";

const WalletTest: React.FC = () => {
  const {
    program,
    connection,
    walletAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useAnchor();
  const [balance, setBalance] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("Test User");
  const [userEmail, setUserEmail] = useState("test@example.com");

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      console.log("Wallet connected successfully");
    } else {
      console.error("Failed to connect wallet");
    }
  };

  const checkBalance = async () => {
    if (!connection || !walletAddress) return;

    try {
      const publicKey = new PublicKey(walletAddress);
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error checking balance:", error);
      setBalance(null);
    }
  };

  const testProgramConnection = async () => {
    if (!program) {
      setTestResult("Program not connected. Connect wallet first.");
      return;
    }

    try {
      // Just test that we can access the program
      const programId = program.programId.toString();
      setTestResult(`Successfully connected to program: ${programId}`);
    } catch (error) {
      console.error("Error testing program connection:", error);
      setTestResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const sendInitializeTransaction = async () => {
    if (!program || !walletAddress) {
      setTestResult("Program or wallet not connected.");
      return;
    }

    setIsLoading(true);
    try {
      const publicKey = new PublicKey(walletAddress);
      const signature = await testInitializeTransaction(program, publicKey);
      setTransactionSignature(signature);
      setTestResult(`Initialize transaction successful!`);
    } catch (error) {
      console.error("Error sending initialize transaction:", error);
      setTestResult(
        `Transaction Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendCreateUserTransaction = async () => {
    if (!program || !walletAddress) {
      setTestResult("Program or wallet not connected.");
      return;
    }

    setIsLoading(true);
    try {
      const publicKey = new PublicKey(walletAddress);
      const signature = await testCreateUserProfile(
        program,
        publicKey,
        userName,
        userEmail
      );
      setTransactionSignature(signature);
      setTestResult(`Create user profile transaction successful!`);
    } catch (error) {
      console.error("Error sending create user transaction:", error);
      setTestResult(
        `Transaction Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Wallet & Program Test</h2>

      <div className="mb-4">
        <p className="mb-2">
          Status:{" "}
          <span className={isConnected ? "text-green-500" : "text-red-500"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </p>

        {walletAddress && (
          <p className="mb-2 truncate">
            Address: <span className="font-mono text-sm">{walletAddress}</span>
          </p>
        )}

        {balance !== null && (
          <p className="mb-2">
            Balance: <span>{balance} SOL</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <button
              onClick={disconnectWallet}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Disconnect
            </button>
            <button
              onClick={checkBalance}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Check Balance
            </button>
            <button
              onClick={testProgramConnection}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Test Program Connection
            </button>

            <hr className="my-2" />

            <h3 className="font-bold mt-2">Test Transactions:</h3>

            <button
              onClick={sendInitializeTransaction}
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Send Initialize Transaction"}
            </button>

            <div className="mt-2">
              <h4 className="font-semibold mb-1">Create User Profile:</h4>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="User Name"
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 border rounded mb-2"
              />
              <button
                onClick={sendCreateUserTransaction}
                disabled={isLoading}
                className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Create User Profile"}
              </button>
            </div>
          </>
        )}
      </div>

      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="font-bold">Test Result:</h3>
          <p>{testResult}</p>
          {transactionSignature && (
            <div className="mt-2">
              <p className="font-semibold">Transaction Signature:</p>
              <p className="font-mono text-xs break-all">
                {transactionSignature}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletTest;
 