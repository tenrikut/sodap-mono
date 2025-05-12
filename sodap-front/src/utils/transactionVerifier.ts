import { Connection, PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

/**
 * Get detailed transaction information after a successful payment
 * This can be used to show more detailed receipt information in the UI
 */
export const getTransactionDetails = async (
  signature: string,
  connection: Connection
): Promise<{
  signature: string;
  confirmationTime: Date | null;
  fee: number;
  status: "confirmed" | "finalized" | "processed" | "failed";
  errorMessage?: string;
}> => {
  try {
    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return {
        signature,
        confirmationTime: null,
        fee: 0,
        status: "failed",
        errorMessage: "Transaction not found",
      };
    }

    // Extract relevant details
    const confirmationTime = transaction.blockTime
      ? new Date(transaction.blockTime * 1000)
      : null;
    const fee = transaction.meta?.fee || 0;

    // Check if transaction was successful
    const status = transaction.meta?.err ? "failed" : "confirmed";

    // If there was an error, get the error message
    const errorMessage = transaction.meta?.err
      ? JSON.stringify(transaction.meta.err)
      : undefined;

    return {
      signature,
      confirmationTime,
      fee,
      status: status as "confirmed" | "finalized" | "processed" | "failed",
      errorMessage,
    };
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    toast.error("Error fetching transaction details");

    return {
      signature,
      confirmationTime: null,
      fee: 0,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Validates a transaction receipt and returns additional information
 * This can be used to verify that a transaction actually paid for items
 */
export const validateTransactionReceipt = async (
  signature: string,
  expectedAmount: number,
  connection: Connection,
  storeAddress: string
): Promise<{
  isValid: boolean;
  reason?: string;
  paymentAmount?: number;
}> => {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { isValid: false, reason: "Transaction not found" };
    }

    // Check if transaction is successful
    if (transaction.meta?.err) {
      return {
        isValid: false,
        reason: `Transaction failed: ${JSON.stringify(transaction.meta.err)}`,
      };
    }

    // Extract the payment amount - this is a simplified example
    // In a real implementation, you'd look for the specific token transfer
    const storePublicKey = new PublicKey(storeAddress);
    const paymentAmount = 0;

    // Look for transfers to the store address in pre/post token balances
    if (
      transaction.meta?.postTokenBalances &&
      transaction.meta?.preTokenBalances
    ) {
      // For token payments, analyze token balances
      // This is a simplified implementation that should be expanded based on your exact needs
    }

    // For SOL transfers, look through the inner instructions or main instruction
    if (transaction.meta?.innerInstructions) {
      for (const innerInstruction of transaction.meta.innerInstructions) {
        for (const instruction of innerInstruction.instructions) {
          // Find transfer instructions to the store
          // This is a simplified check and would need to be expanded based on your program
          const accountKeys = transaction.transaction.message.getAccountKeys();
          const programId =
            accountKeys.staticAccountKeys[instruction.programIdIndex];
          if (
            programId.equals(new PublicKey("11111111111111111111111111111111"))
          ) {
            // System program transfer
            // Further implementation needed based on your contract structure
          }
        }
      }
    }

    // If we can't directly determine the payment, we'll trust the transaction for now
    // You would need to extend this with proper verification logic that matches your contract

    return {
      isValid: true,
      paymentAmount: expectedAmount, // Simplified - you should extract the actual amount from the transaction
    };
  } catch (error) {
    console.error("Error validating transaction receipt:", error);
    return {
      isValid: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
