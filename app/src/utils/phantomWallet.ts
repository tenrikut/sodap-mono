// src/utils/phantomWallet.ts

import { toast } from "sonner";
import type { PublicKey, Transaction } from "@solana/web3.js";

// Define the shape of events emitted by Phantom
interface PhantomEvent {
  type: string;
  data: unknown;
}

// Define the shape of the Phantom provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  isPhantom?: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: (opts?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args: PhantomEvent) => void) => void;
  request: (method: unknown) => Promise<unknown>;
  isUnlocked: () => Promise<boolean>;
}

// Helper: grab the Phantom provider
export const getProvider = (): PhantomProvider | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  // Check if browser is running in a secure context
  if (!window.isSecureContext) {
    console.warn("Phantom may not work - window is not in a secure context");
  }

  // Look for Phantom provider on solana object
  if (
    "phantom" in window &&
    window.phantom?.solana &&
    window.phantom.solana.isPhantom
  ) {
    return window.phantom.solana as PhantomProvider;
  }

  // Fall back to any solana provider on window as a secondary check
  if (
    "solana" in window &&
    (window as { solana?: { isPhantom?: boolean } }).solana?.isPhantom
  ) {
    return (window as { solana: PhantomProvider }).solana;
  }

  console.warn(
    "Phantom wallet not found! Please install Phantom: https://phantom.app/"
  );
  return undefined;
};

/**
 * Connects to the Phantom wallet or creates a demo wallet in development mode
 * @returns true if connected successfully, false otherwise
 */
export const connectWallet = async (): Promise<boolean> => {
  try {
    // Check if we're in development mode
    const isDevelopmentMode = import.meta.env.DEV; // Vite provides this boolean

    // In development mode, we can use a demo wallet
    if (isDevelopmentMode) {
      console.log("Development mode: Using demo wallet");

      // Generate a consistent demo wallet ID
      const demoWalletId = `SolanaDemoWallet${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      // Store the demo wallet address in localStorage and sessionStorage
      localStorage.setItem("walletAddress", demoWalletId);
      sessionStorage.setItem("walletAddress", demoWalletId);

      console.log("Connected to demo wallet:", demoWalletId);
      toast.success("Demo wallet connected successfully");

      return true;
    }

    // Check if Phantom wallet is available
    const phantom = window.phantom?.solana;

    if (!phantom) {
      console.error("Phantom wallet not found");
      toast.error(
        "Phantom wallet extension not found. Please install it first."
      );
      return false;
    }

    // Try to connect to Phantom
    try {
      console.log("Attempting to connect to Phantom wallet...");

      // Try to connect with a timeout to ensure the extension is ready
      const connectPromise = phantom.connect({ onlyIfTrusted: false });

      // Add a timeout to detect if the wallet is taking too long
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timed out")), 15000);
      });

      // Race the connection against the timeout
      const resp = (await Promise.race([connectPromise, timeoutPromise])) as {
        publicKey: PublicKey;
      };
      const address = resp.publicKey.toString();

      // Store the wallet address in localStorage and sessionStorage
      localStorage.setItem("walletAddress", address);
      sessionStorage.setItem("walletAddress", address);

      console.log("Connected to Phantom wallet:", address);
      toast.success("Wallet connected successfully");

      return true;
    } catch (error) {
      console.error("Error connecting to wallet:", error);

      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error(
            "Connection rejected. Please approve the connection request."
          );
        } else if (error.message.includes("timed out")) {
          toast.error(
            "Connection timed out. Please check if Phantom is unlocked."
          );
        } else {
          toast.error(`Failed to connect: ${error.message}`);
        }
      } else {
        toast.error("Unexpected error connecting to wallet");
      }

      return false;
    }
  } catch (error) {
    console.error("Error in connectWallet:", error);
    toast.error("Failed to connect to wallet");
    return false;
  }
};

/**
 * Disconnects from the Phantom wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  const provider = getProvider();

  if (!provider) {
    console.error("Phantom wallet provider not found");
    return;
  }

  try {
    await provider.disconnect();
    console.log("Disconnected from Phantom wallet");
  } catch (error) {
    console.error("Error disconnecting from wallet:", error);
    throw error;
  }
};

/**
 * Checks if a wallet is connected
 * @returns true if a wallet is connected, false otherwise
 */
export const isWalletConnected = (): boolean => {
  // Check if we're in development mode
  const isDevelopmentMode = import.meta.env.DEV; // Vite provides this boolean

  // Check for stored wallet address
  const storedAddress = localStorage.getItem("walletAddress");

  if (isDevelopmentMode && storedAddress?.startsWith("SolanaDemo")) {
    // In development mode, we consider demo wallets as connected
    return true;
  }

  // Check if Phantom wallet is available
  const phantom = window.phantom?.solana;

  if (!phantom) {
    return false;
  }

  // Check if we have a stored public key
  return !!storedAddress;
};

/**
 * Gets the current wallet address
 * @returns The wallet address as a string, or null if not connected
 */
export const getWalletAddress = (): string | null => {
  // Check stored wallet address first
  const storedAddress = localStorage.getItem("walletAddress");

  if (storedAddress) {
    return storedAddress;
  }

  // If no stored address, we're not connected
  return null;
};

/**
 * Gets the public key of the connected wallet
 */
export const getWalletPublicKey = (): PublicKey | null => {
  const provider = getProvider();
  return provider?.publicKey || null;
};

/**
 * Sign a transaction with the Phantom wallet
 */
export const signTransaction = async (
  transaction: Transaction
): Promise<Transaction> => {
  const provider = getProvider();

  if (!provider) {
    throw new Error("Phantom wallet provider not found");
  }

  try {
    return await provider.signTransaction(transaction);
  } catch (error) {
    console.error("Error signing transaction:", error);
    throw error;
  }
};

/**
 * Initializes listeners for wallet connection events
 */
export const initWalletListeners = (
  onConnect?: (publicKey: string) => void,
  onDisconnect?: () => void
): void => {
  const provider = getProvider();

  if (!provider) {
    return;
  }

  // Listen for connect events
  provider.on("connect", (event: PhantomEvent) => {
    console.log("Phantom wallet connected event:", event);
    const publicKey = (
      event.data as { publicKey: PublicKey }
    ).publicKey.toString();
    if (onConnect) onConnect(publicKey);
  });

  // Listen for disconnect events
  provider.on("disconnect", () => {
    console.log("Phantom wallet disconnected event");
    if (onDisconnect) onDisconnect();
  });
};
