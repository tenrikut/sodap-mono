import {
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
} from "@solana/wallet-adapter-base";
import type { PublicKey } from "@solana/web3.js";

/**
 * Helper function to handle wallet errors and provide user-friendly messages
 */
export function handleWalletError(error: unknown): string {
  console.error("Wallet error:", error);

  if (error instanceof WalletNotConnectedError) {
    return "Please connect your wallet to continue.";
  }

  if (error instanceof WalletNotReadyError) {
    return "Wallet not ready. Please check if Phantom is installed and unlocked.";
  }

  if (error instanceof WalletError) {
    if (error.message.includes("User rejected")) {
      return "Connection rejected. Please approve the connection request in your wallet.";
    }
    if (error.message.includes("timeout")) {
      return "Connection timed out. Please try again.";
    }
    if (error.message.includes("No wallet selected")) {
      return "Please select a wallet to connect.";
    }
    if (error.message.includes("Wallet not found")) {
      return "Wallet not found. Please make sure Phantom is installed and unlocked.";
    }
    return `Wallet error: ${error.message}`;
  }

  if (error instanceof Error) {
    // Common Solana transaction errors
    if (error.message.includes("0x1")) {
      return "Insufficient funds for transaction.";
    }
    if (error.message.includes("0x2")) {
      return "Invalid account data.";
    }
    if (error.message.includes("Custom program error: 0x1")) {
      return "Program error: Invalid instruction data.";
    }
    if (error.message.includes("Custom program error: 0x2")) {
      return "Program error: Invalid program account data.";
    }
    if (error.message.includes("blockhash")) {
      return "Transaction expired. Please try again.";
    }
    if (error.message.includes("Blockhash not found")) {
      return "Network error. Please try again.";
    }
    if (error.message.includes("insufficient funds")) {
      return "Insufficient SOL in your wallet. Please add funds and try again.";
    }

    // User interaction errors
    if (error.message.includes("User rejected")) {
      return "Transaction rejected. Please approve the transaction in your wallet.";
    }
    if (error.message.includes("timeout")) {
      return "Transaction timed out. Please try again.";
    }
    if (error.message.includes("Failed to connect")) {
      return "Failed to connect to wallet. Please try again or use a different wallet.";
    }

    // Transaction signing errors
    if (error.message.includes("failed to sign")) {
      return "Failed to sign transaction. Please try again.";
    }
    if (error.message.includes("Transaction was not confirmed")) {
      return "Transaction was not confirmed. Please check your wallet for details.";
    }

    return `Error: ${error.message}`;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Type definition for Phantom wallet window object
 */
interface PhantomWindow extends Window {
  phantom?: {
    solana?: {
      isPhantom: boolean;
      connect: (options?: {
        onlyIfTrusted?: boolean;
      }) => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: <T>(transaction: T) => Promise<T>;
      signAllTransactions: <T>(transactions: T[]) => Promise<T[]>;
      isUnlocked: () => Promise<boolean>;
    };
  };
}

/**
 * Helper function to detect if Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const phantom = (window as PhantomWindow)?.phantom;
  return phantom && phantom.solana && phantom.solana.isPhantom;
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
    case "localnet":
    default:
      return "Local Network";
  }
}
