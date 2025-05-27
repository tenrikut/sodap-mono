import { Connection, PublicKey } from "@solana/web3.js";

export type TransactionStatus = "success" | "failed" | "timeout" | "pending";

interface TransactionMonitorOptions {
  /**
   * Maximum time to wait for transaction confirmation (in milliseconds)
   * @default 45000 (45 seconds)
   */
  timeout?: number;

  /**
   * Polling interval for checking transaction status (in milliseconds)
   * @default 1500 (1.5 seconds)
   */
  interval?: number;

  /**
   * Last valid block height for transaction expiry check
   */
  lastValidBlockHeight?: number;
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
  const { timeout = 45000, interval = 1500, lastValidBlockHeight } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = Math.ceil(timeout / interval);

    console.log(`Monitoring transaction ${signature} for up to ${timeout}ms`);

    const checkTransaction = async () => {
      try {
        attempts++;

        // If we have a signature, check it directly
        if (signature) {
          // Use getSignatureStatuses for faster response
          const statusResponse = await connection.getSignatureStatuses([
            signature,
          ]);
          const status = statusResponse.value[0];

          if (status !== null) {
            if (status.err) {
              console.error(`Transaction ${signature} failed:`, status.err);
              clearTimeout(timeoutId);
              clearInterval(intervalId);
              resolve("failed");
              return;
            }

            // Check confirmation level
            const confirmationLevel = status.confirmationStatus;
            if (
              confirmationLevel === "confirmed" ||
              confirmationLevel === "finalized"
            ) {
              console.log(
                `Transaction ${signature} confirmed at level: ${confirmationLevel}`
              );
              clearTimeout(timeoutId);
              clearInterval(intervalId);
              resolve("success");
              return;
            }

            console.log(
              `Transaction ${signature} found but not yet confirmed. Status: ${confirmationLevel}`
            );
          }

          // Check if blockhash is still valid
          if (lastValidBlockHeight) {
            const currentBlockHeight = await connection.getBlockHeight(
              "processed"
            );
            if (currentBlockHeight > lastValidBlockHeight) {
              console.log(
                `Transaction ${signature} expired (blockhash too old)`
              );
              clearTimeout(timeoutId);
              clearInterval(intervalId);
              resolve("failed");
              return;
            }
          }
        }

        // If we have a reference, check for transactions referencing it
        if (reference && !signature) {
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
        console.error(
          `Error checking transaction status (attempt ${attempts}):`,
          error
        );
      }
    };

    const intervalId: NodeJS.Timeout = setInterval(checkTransaction, interval);

    // Set timeout
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      console.log(
        `Transaction ${signature} monitoring timed out after ${
          Date.now() - startTime
        }ms`
      );
      resolve("timeout");
    }, timeout);

    // Start polling immediately
    checkTransaction();
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

/**
 * Fast transaction status check (doesn't wait)
 * @param connection Solana connection instance
 * @param signature Transaction signature to check
 * @returns Promise that resolves with the transaction status
 */
export async function checkTransactionStatus(
  connection: Connection,
  signature: string
): Promise<TransactionStatus> {
  try {
    // Use getSignatureStatuses for faster response
    const statusResponse = await connection.getSignatureStatuses([signature]);
    const status = statusResponse.value[0];

    if (status === null) {
      return "pending";
    }

    if (status.err) {
      return "failed";
    }

    if (
      status.confirmationStatus === "confirmed" ||
      status.confirmationStatus === "finalized"
    ) {
      return "success";
    }

    return "pending";
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return "pending";
  }
}
