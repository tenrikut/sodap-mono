import React, { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey, clusterApiUrl, Keypair } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { createAnchorProvider, createAnchorProgram } from "../utils/anchor";
import { Sodap } from "../idl/sodap";
import { handleWalletError } from "@/lib/walletErrorHandler";
import { toast } from "sonner";
import { AnchorContext } from "./AnchorContext.context";
import { useWallet } from "@solana/wallet-adapter-react";

export const SodapAnchorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [program, setProgram] = useState<Program<Sodap> | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use the wallet adapter from @solana/wallet-adapter-react
  const {
    publicKey,
    connecting,
    connected,
    disconnect: walletDisconnect,
    connect: walletAdapterConnect,
    signTransaction,
    signAllTransactions,
  } = useWallet();

  // Initialize Anchor program using the connected wallet
  const initializeAnchorProgram = useCallback(
    async (address: string, conn: Connection): Promise<void> => {
      try {
        // Use the wallet adapter directly
        if (!publicKey || !signTransaction || !signAllTransactions) {
          throw new Error("Wallet not fully connected");
        }

        // Create a wallet adapter for Anchor that uses the wallet-adapter-react
        const dummyKeypair = Keypair.generate();
        // Override the keypair's publicKey to match wallet
        Object.defineProperty(dummyKeypair, "publicKey", {
          get: () => publicKey,
        });

        const wallet = {
          publicKey,
          signTransaction,
          signAllTransactions,
          // Add payer property needed by Anchor
          get payer() {
            return dummyKeypair;
          },
        };

        const provider = createAnchorProvider(conn, wallet);
        const anchorProgram = createAnchorProgram(provider);
        setProgram(anchorProgram);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to initialize Anchor program:", error);
        toast.error("Failed to initialize program");
        setIsConnected(false);
        setProgram(null);
      }
    },
    [publicKey, signTransaction, signAllTransactions]
  );

  // Initialize connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        // First try to use the RPC URL, then fallback to clusterApiUrl
        const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL;
        const network = import.meta.env.VITE_SOLANA_NETWORK || "devnet";

        // Use the explicit RPC URL if available, otherwise use clusterApiUrl
        const endpoint =
          rpcUrl ||
          (process.env.NODE_ENV === "development" && network === "localhost"
            ? "http://localhost:8899"
            : clusterApiUrl(network as "devnet" | "testnet" | "mainnet-beta"));

        console.log("Connecting to Solana at:", endpoint);
        const connection = new Connection(endpoint, "confirmed");
        setConnection(connection);

        // Check if wallet was previously connected in this session
        const savedWalletAddress = sessionStorage.getItem("walletAddress");
        if (savedWalletAddress) {
          console.log("Found previously connected wallet:", savedWalletAddress);
          setWalletAddress(savedWalletAddress);
          await initializeAnchorProgram(savedWalletAddress, connection);
        }
      } catch (error) {
        console.error("Error initializing connection:", error);
        toast.error("Failed to connect to Solana network");
      } finally {
        setIsLoading(false);
      }
    };

    initConnection();
  }, []);

  // Track wallet connection status
  useEffect(() => {
    if (connected && publicKey && connection) {
      setWalletAddress(publicKey.toString());
      setIsConnected(true);

      // Initialize Anchor program when wallet connects
      initializeAnchorProgram(publicKey.toString(), connection);
    } else if (!connecting && !connected) {
      setIsConnected(false);
      // Do not reset program or wallet address immediately
      // This allows for temporary disconnections without losing state
    }
  }, [connected, connecting, publicKey, connection, initializeAnchorProgram]);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!connection) {
        console.error("No connection available");
        toast.error("No connection to Solana. Please reload the page.");
        return false;
      }

      console.log("Attempting to connect wallet...");

      // Check if wallet adapter is available
      if (!walletAdapterConnect) {
        console.error("Wallet adapter connect function is undefined");
        toast.error("Wallet connection not available. Please try again later.");
        return false;
      }

      // Force wallet modal to appear by using document.dispatchEvent
      const walletBtn = document.querySelector(
        ".wallet-adapter-button-trigger"
      );
      if (walletBtn instanceof HTMLElement) {
        walletBtn.click();
      } else {
        // If button not found, try the direct connect method
        await walletAdapterConnect();
      }

      // Wait for connection
      let attempts = 0;
      const maxAttempts = 10;

      while (!connected && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      console.log(`Wallet connected: ${connected} after ${attempts} attempts`);
      return connected;
    } catch (error) {
      console.error("Error during wallet connection:", error);

      // Use the wallet error handler to provide a user-friendly message
      const errorMessage = handleWalletError(error);
      toast.error(errorMessage);

      // Log additional details for debugging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      return false;
    }
  }, [connection, walletAdapterConnect]);

  const disconnectWallet = useCallback(() => {
    try {
      walletDisconnect();
      setProgram(null);
      setWalletAddress(null);
      setIsConnected(false);
      sessionStorage.removeItem("walletAddress");
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  }, [walletDisconnect]);

  return (
    <AnchorContext.Provider
      value={{
        program,
        connection,
        walletAddress,
        isConnected,
        isLoading,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AnchorContext.Provider>
  );
};
