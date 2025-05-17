import { createContext } from "react";
import { Connection } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Sodap } from "@/idl";

// Define the context shape
export interface AnchorContextType {
  program: Program<Sodap> | null;
  connection: Connection | null;
  walletAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  isLoading: boolean;
}

// Create the context
export const AnchorContext = createContext<AnchorContextType>({
  program: null,
  connection: null,
  walletAddress: null,
  isConnected: false,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  isLoading: true,
});
