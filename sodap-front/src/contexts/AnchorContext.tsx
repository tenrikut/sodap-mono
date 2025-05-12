import React, { useState, useEffect, useContext } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { IDL, PROGRAM_ID } from "../idl";
import {
  createAnchorProvider,
  createPhantomWalletAdapter,
  createAnchorProgram,
} from "../utils/anchor";
import { handleWalletError } from "@/lib/walletErrorHandler";
import { toast } from "sonner";
import { AnchorContext, AnchorContextType } from "./AnchorContext.context";

// Export a hook for using the context directly - for backward compatibility
export const useAnchor = (): AnchorContextType => useContext(AnchorContext);

// Context provider component
export const SodapAnchorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        // Use environment variables with fallbacks
        let endpoint =
          import.meta.env.VITE_SOLANA_NETWORK ||
          process.env.REACT_APP_SOLANA_NETWORK;

        // If no environment variable is set, use Devnet by default
        if (!endpoint) {
          // FORCE DEVNET: Always use Devnet regardless of environment
          endpoint = clusterApiUrl("devnet");
          console.log("FORCING CONNECTION TO SOLANA DEVNET");
        } else if (
          !/^https?:\/\//i.test(endpoint) &&
          endpoint !== "devnet" &&
          endpoint !== "testnet" &&
          endpoint !== "mainnet-beta"
        ) {
          // Add http:// prefix if the endpoint doesn't start with http:// or https:// and isn't a network name
          endpoint = `http://${endpoint}`;
          console.log("Adding http:// prefix to endpoint:", endpoint);
        } else if (
          endpoint === "devnet" ||
          endpoint === "testnet" ||
          endpoint === "mainnet-beta"
        ) {
          // Handle network names
          endpoint = clusterApiUrl(endpoint);
          console.log(`Using Solana ${endpoint} network`);
        }

        console.log("Connecting to Solana at:", endpoint);
        const connection = new Connection(endpoint, "confirmed");
        setConnection(connection);

        // Check if wallet was previously connected in this session
        const savedWalletAddress = sessionStorage.getItem("walletAddress");
        if (savedWalletAddress) {
          console.log("Found previously connected wallet:", savedWalletAddress);
          setWalletAddress(savedWalletAddress);

          try {
            await initializeAnchorProgram(savedWalletAddress, connection);
          } catch (error) {
            console.error(
              "Error initializing with saved wallet address:",
              error
            );
            // Clear the saved wallet info since it failed
            sessionStorage.removeItem("walletAddress");
            setWalletAddress(null);
            // Don't show an error toast here - just quietly fail
          }
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

  const initializeAnchorProgram = async (
    address: string,
    conn: Connection
  ): Promise<void> => {
    try {
      console.log("Initializing Anchor program with address:", address);
      console.log("Connection endpoint:", conn.rpcEndpoint);
      console.log("Is connection to Devnet:", conn.rpcEndpoint.includes("devnet"));
      
      const publicKey = new PublicKey(address);
      const wallet = createPhantomWalletAdapter(publicKey);
      const provider = createAnchorProvider(conn, wallet);

      // Ensure IDL and program ID are correctly configured
      console.log(
        "Creating Anchor program with program ID:",
        PROGRAM_ID.toString()
      );
      console.log("Using IDL:", JSON.stringify(IDL).substring(0, 100) + "...");
      const anchorProgram = createAnchorProgram(provider);

      if (!anchorProgram) {
        throw new Error("Failed to create Anchor program - program is null");
      }

      console.log(
        "Program successfully initialized:",
        anchorProgram.programId.toString()
      );
      setProgram(anchorProgram);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to initialize Anchor program:", error);
      toast.error(
        "Failed to initialize program: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setIsConnected(false);
      setProgram(null);
    }
  };

  // Connect wallet function
  const connectWallet = async (): Promise<boolean> => {
    try {
      if (!connection) {
        throw new Error("No connection available");
      }

      if (typeof window === "undefined" || !window.phantom?.solana) {
        throw new Error("Phantom wallet not installed");
      }

      console.log("Connecting to Phantom wallet...");
      const { publicKey } = await window.phantom.solana.connect();
      if (!publicKey) {
        throw new Error("Failed to get public key from wallet");
      }

      const address = publicKey.toString();
      console.log("Wallet connected with address:", address);

      setWalletAddress(address);
      sessionStorage.setItem("walletAddress", address);

      // Initialize Anchor program with the connected wallet
      await initializeAnchorProgram(address, connection);
      toast.success("Wallet connected successfully");
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      const errorMessage = handleWalletError(error);
      toast.error(errorMessage);
      return false;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async (): Promise<void> => {
    try {
      if (window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      }
      setWalletAddress(null);
      setProgram(null);
      setIsConnected(false);
      sessionStorage.removeItem("walletAddress");
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  return (
    <AnchorContext.Provider
      value={{
        program,
        connection,
        walletAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
        isLoading,
      }}
    >
      {children}
    </AnchorContext.Provider>
  );
};
