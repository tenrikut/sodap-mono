import { Connection, PublicKey } from "@solana/web3.js";

export type TransactionStatus = "success" | "failed" | "timeout" | "pending";

interface TransactionMonitorOptions {
  /**
   * Maximum time to wait for transaction confirmation (in milliseconds)
   * @default 60000 (60 seconds)
   */
  timeout?: number;

  /**
   * Polling interval for checking transaction status (in milliseconds)
   * @default 1000 (1 second)
   */
  interval?: number;
}

/**
 * Monitor a transaction for completion
 * @param connection Solana connection instance
 * @param signature Transaction signature to monitor
 * @param reference Optional reference PublicKey to check for transaction
 * @param options Monitoring options
 * @returns Promise that resolves with the transaction status
 */
export async function monitorTransaction(
  connection: Connection,
  signature?: string,
  reference?: PublicKey,
  options: TransactionMonitorOptions = {}
): Promise<TransactionStatus> {
  const { timeout = 60000, interval = 1000 } = options;

  return new Promise((resolve) => {
    // (removed unused timeoutId declaration, now declared on assignment)

    const checkTransaction = async () => {
      try {
        // If we have a signature, check it directly
        if (signature) {
          const tx = await connection.getTransaction(signature, {
            commitment: "confirmed",
          });

          if (tx) {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            resolve(tx.meta?.err ? "failed" : "success");
            return;
          }
        }

        // If we have a reference, check for transactions referencing it
        if (reference) {
          const signatures = await connection.getSignaturesForAddress(
            reference,
            {
              limit: 1,
            }
          );

          if (signatures.length > 0) {
            const tx = await connection.getTransaction(
              signatures[0].signature,
              {
                commitment: "confirmed",
              }
            );

            if (tx) {
              clearTimeout(timeoutId);
              clearInterval(intervalId);
              resolve(tx.meta?.err ? "failed" : "success");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking transaction:", error);
      }
    };

    const intervalId: NodeJS.Timeout = setInterval(checkTransaction, interval);

    // Set timeout
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      resolve("timeout");
    }, timeout);

    // Start polling
    checkTransaction(); // Check immediately as well
  });
}

/**
 * Helper to format a transaction status for display
 */
export function getTransactionStatusMessage(status: TransactionStatus): string {
  switch (status) {
    case "success":
      return "Transaction completed successfully";
    case "failed":
      return "Transaction failed";
    case "timeout":
      return "Transaction timed out. It may still complete - please check your wallet.";
    case "pending":
      return "Transaction pending...";
    default:
      return "Unknown transaction status";
  }
}
function checkTransaction() {
  throw new Error("Function not implemented.");
}

// removed stub
