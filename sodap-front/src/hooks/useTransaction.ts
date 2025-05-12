import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, TransactionInstruction, Signer } from "@solana/web3.js";
import { toast } from "sonner";
import { handleWalletError } from "@/lib/walletErrorHandler";
import {
  monitorTransaction,
  TransactionStatus,
} from "@/lib/transactionMonitor";

interface UseTransactionOptions {
  /**
   * Optional callback when transaction completes successfully
   */
  onSuccess?: (signature: string) => void;

  /**
   * Optional callback when transaction fails
   */
  onError?: (error: Error) => void;

  /**
   * Optional callback when transaction status changes
   */
  onStatusChange?: (status: TransactionStatus) => void;

  /**
   * Whether to show toast notifications for status changes
   * @default true
   */
  showNotifications?: boolean;
}

/**
 * Hook for managing Solana transactions with status monitoring and error handling
 */
export function useTransaction(options: UseTransactionOptions = {}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("pending");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    onSuccess,
    onError,
    onStatusChange,
    showNotifications = true,
  } = options;

  const updateStatus = (status: TransactionStatus) => {
    setTransactionStatus(status);
    onStatusChange?.(status);

    if (showNotifications) {
      switch (status) {
        case "success":
          toast.success("Transaction completed successfully");
          break;
        case "failed":
          toast.error("Transaction failed");
          break;
        case "timeout":
          toast.error(
            "Transaction timed out. It may still complete - please check your wallet."
          );
          break;
      }
    }
  };

  const sendAndConfirmTransaction = useCallback(
    async (instructions: TransactionInstruction[], signers: Signer[] = []) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setIsProcessing(true);
      updateStatus("pending");

      try {
        const transaction = new Transaction();

        // Add instructions to transaction
        instructions.forEach((instruction) => transaction.add(instruction));

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Send transaction
        const signature = await sendTransaction(transaction, connection);

        // Monitor transaction
        const status = await monitorTransaction(connection, signature);
        updateStatus(status);

        if (status === "success") {
          onSuccess?.(signature);
          return signature;
        } else {
          throw new Error("Transaction failed with status: " + status);
        }
      } catch (error) {
        const errorMessage = handleWalletError(error);
        if (showNotifications) {
          toast.error(errorMessage);
        }
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      connection,
      publicKey,
      sendTransaction,
      onSuccess,
      onError,
      showNotifications,
    ]
  );

  return {
    sendAndConfirmTransaction,
    transactionStatus,
    isProcessing,
  };
}
