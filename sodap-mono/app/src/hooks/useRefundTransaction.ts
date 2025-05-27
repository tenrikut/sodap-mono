import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "sonner";
import { ReturnRequest } from "./useReturnRequests";
import { handleWalletError } from "@/lib/walletErrorHandler";
import {
  monitorTransaction,
  TransactionStatus,
} from "@/lib/transactionMonitor";

export interface RefundTransactionResult {
  signature: string;
  status: "success" | "failed" | "pending";
}

/**
 * Helper function to manually check transaction status
 */
export const checkTransactionStatus = async (
  connection: Connection,
  signature: string
): Promise<TransactionStatus> => {
  try {
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });

    if (status.value === null) {
      return "pending";
    }

    if (status.value.err) {
      console.error("Transaction failed:", status.value.err);
      return "failed";
    }

    if (
      status.value.confirmationStatus === "confirmed" ||
      status.value.confirmationStatus === "finalized"
    ) {
      return "success";
    }

    return "pending";
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return "failed";
  }
};

interface Purchase {
  id: string;
  transactionSignature: string;
  storeName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  receiptAddress: string;
  storeAddress: string;
  buyerAddress: string;
  purchaseTimestamp: number;
  totalAmount: number;
}

export const useRefundTransaction = () => {
  // Use 'processed' commitment for faster confirmation
  const { connection } = useConnection();
  const { publicKey: storeWallet, signTransaction } = useWallet();

  const processRefund = useCallback(
    async (purchase: Purchase): Promise<RefundTransactionResult> => {
      // Extract buyer wallet address from the purchase object
      let buyerWallet;
      try {
        if (purchase.buyerAddress) {
          buyerWallet = new PublicKey(purchase.buyerAddress);
        } else {
          throw new Error("Buyer wallet address is missing or invalid");
        }
      } catch (error) {
        console.error("Error creating buyer PublicKey:", error);
        throw new Error("Invalid buyer wallet address");
      }

      try {
        if (!storeWallet || !signTransaction) {
          throw new Error("Store wallet not connected");
        }

        // Check store wallet balance first to ensure sufficient funds
        const balance = await connection.getBalance(storeWallet);
        console.log(`Store wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        // Calculate total refund amount
        const refundAmount = purchase.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );

        // Convert SOL to lamports
        const lamportsToSend = Math.round(refundAmount * LAMPORTS_PER_SOL);
        console.log(
          `Attempting to refund: ${refundAmount} SOL (${lamportsToSend} lamports)`
        );

        // Check if we have enough balance (including fees)
        const estimatedFee = 5000; // Estimated transaction fee in lamports
        if (balance < lamportsToSend + estimatedFee) {
          throw new Error(
            `Insufficient funds for refund. Need at least ${
              (lamportsToSend + estimatedFee) / LAMPORTS_PER_SOL
            } SOL, but have ${balance / LAMPORTS_PER_SOL} SOL`
          );
        }

        // Create refund transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: storeWallet,
            toPubkey: buyerWallet,
            lamports: lamportsToSend,
          })
        );

        // Get latest blockhash with processed commitment for faster confirmation
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("processed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = storeWallet;

        console.log("Transaction created, requesting signature...");

        // Implement retry logic for transaction sending
        const maxRetries = 3;
        let signature: string;
        let retryCount = 0;

        while (retryCount < maxRetries) {
          try {
            // Sign transaction
            const signed = await signTransaction(transaction);
            console.log(
              `Transaction signed (attempt ${
                retryCount + 1
              }), sending to network...`
            );

            // Send transaction with improved settings
            signature = await connection.sendRawTransaction(
              signed.serialize(),
              {
                skipPreflight: false,
                preflightCommitment: "processed", // Faster preflight
                maxRetries: 2,
              }
            );

            console.log("Transaction sent successfully, signature:", signature);
            break; // Success, exit retry loop
          } catch (sendError) {
            retryCount++;
            console.error(
              `Transaction send attempt ${retryCount} failed:`,
              sendError
            );

            if (retryCount >= maxRetries) {
              // Handle specific error types
              if (sendError instanceof Error) {
                if (sendError.message.includes("insufficient funds")) {
                  throw new Error(
                    "Insufficient funds in store wallet. Please add SOL and try again."
                  );
                } else if (sendError.message.includes("User rejected")) {
                  throw new Error("Transaction was rejected by the user.");
                } else if (sendError.message.includes("blockhash")) {
                  throw new Error("Transaction expired. Please try again.");
                }
              }
              throw sendError;
            }

            // Wait before retry (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
          }
        }

        console.log("Waiting for confirmation...");

        // Wait for transaction confirmation with improved settings
        const status = await monitorTransaction(
          connection,
          signature,
          undefined, // No reference PublicKey needed
          {
            timeout: 45000, // 45 seconds timeout for better UX
            interval: 1500, // Check every 1.5 seconds for faster detection
            lastValidBlockHeight, // Pass the block height for expiry checking
          }
        );

        console.log("Transaction status:", status);

        // Handle timeout case specifically
        if (status === "timeout") {
          console.warn("Transaction timed out, but may still be processing");
          const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
          toast.warning(
            `Transaction is taking longer than expected. Check status: ${explorerUrl}`,
            { duration: 10000 }
          );
          return {
            signature,
            status: "pending",
          };
        }

        // Return result
        return {
          signature,
          status: status === "success" ? "success" : "failed",
        };
      } catch (error) {
        console.error("Error processing refund:", error);

        // Enhanced error handling with specific error types
        let errorMessage = "Failed to process refund. ";

        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          if (message.includes("insufficient funds")) {
            errorMessage =
              "Insufficient funds in store wallet. Please add SOL to the store wallet and try again.";
          } else if (
            message.includes("user rejected") ||
            message.includes("rejected")
          ) {
            errorMessage = "Transaction was rejected by the user.";
          } else if (
            message.includes("network") ||
            message.includes("connection")
          ) {
            errorMessage =
              "Network connection issue. Please check your internet connection and try again.";
          } else if (
            message.includes("timeout") ||
            message.includes("congested")
          ) {
            errorMessage =
              "Network congestion detected. The transaction may still be processing. Please check Solana Explorer.";
          } else if (
            message.includes("blockhash") ||
            message.includes("expired")
          ) {
            errorMessage = "Transaction expired. Please try again.";
          } else {
            errorMessage = `Transaction failed: ${error.message}`;
          }
        }

        const handleWalletErrorResult = handleWalletError(error);
        const finalErrorMessage = handleWalletErrorResult || errorMessage;

        toast.error(finalErrorMessage);
        throw error;
      }
    },
    [connection, storeWallet, signTransaction]
  );

  return {
    processRefund,
    checkTransactionStatus: (signature: string) =>
      checkTransactionStatus(connection, signature),
  };
};
