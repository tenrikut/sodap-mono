import {
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletTimeoutError,
  WalletSignTransactionError,
} from "@solana/wallet-adapter-base";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean;
  autoApprove: boolean;
  connect: (options?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(
    transaction: T
  ) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ) => Promise<T[]>;
  signMessage: (
    message: Uint8Array,
    display?: "hex" | "utf8"
  ) => Promise<{ signature: Uint8Array }>;
  isUnlocked: boolean;
}

interface TransactionError extends Error {
  code?: number;
}

declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
      };
    };
  }
}

/**
 * Helper function to handle wallet errors and provide user-friendly messages
 */
export function handleWalletError(error: unknown): string {
  console.error("Wallet error:", error);

  // Handle known wallet adapter errors
  if (error instanceof WalletNotConnectedError) {
    return "Please connect your wallet to continue.";
  }

  if (error instanceof WalletNotReadyError) {
    return "Wallet not ready. Please check if it is installed and unlocked.";
  }

  if (error instanceof WalletConnectionError) {
    return "Failed to connect to wallet. Please try again.";
  }

  if (error instanceof WalletDisconnectedError) {
    return "Wallet disconnected. Please reconnect to continue.";
  }

  if (error instanceof WalletTimeoutError) {
    return "Wallet connection timed out. Please try again.";
  }

  if (error instanceof WalletSignTransactionError) {
    return "Failed to sign transaction. Please try again.";
  }

  if (error instanceof WalletError) {
    if (error.message.includes("User rejected")) {
      return "Connection rejected. Please approve the connection request.";
    }
    return `Wallet error: ${error.message}`;
  }

  // Handle transaction-specific errors
  if (error instanceof Error) {
    const txError = error as TransactionError;

    if (txError.code === -32603) {
      return "Transaction failed. Please check your wallet balance.";
    }

    if (txError.code === -32002) {
      return "Wallet request pending. Please check your wallet.";
    }

    // Solana Pay specific errors
    if (error.message.includes("Invalid payment request")) {
      return "Invalid payment request. Please check the transaction details.";
    }

    if (error.message.includes("Payment cancelled")) {
      return "Payment was cancelled. Please try again.";
    }

    if (error.message.includes("Point of sale error")) {
      return "Store transaction error. Please try again or contact support.";
    }

    // Transaction simulation errors
    if (error.message.includes("blockhash not found")) {
      return "Transaction expired. Please try again.";
    }

    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds in your wallet. Please add funds and try again.";
    }

    // Network errors
    if (error.message.includes("rate limit")) {
      return "Too many requests. Please wait a moment and try again.";
    }

    if (
      error.message.includes("socket hang up") ||
      error.message.includes("network error") ||
      error.message.includes("failed to fetch")
    ) {
      return "Network connection error. Please check your internet connection.";
    }

    // Return original error message if no specific handling
    return error.message;
  }

  // Fallback error message
  return "An unexpected error occurred. Please try again.";
}

/**
 * Helper function to detect if Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.phantom?.solana?.isPhantom === true
    );
  } catch {
    return false;
  }
}

/**
 * Helper to get wallet adapter network name
 */
export function getNetworkName(network: string): string {
  switch (network) {
    case "mainnet-beta":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "devnet":
      return "Devnet";
    default:
      return "Unknown Network";
  }
}

/**
 * Helper to check if a wallet address is valid
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    if (!address) return false;
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}
