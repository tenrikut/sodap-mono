import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, TransactionSignature } from "@solana/web3.js";

export type TransactionStatus = "pending" | "confirmed" | "failed";

interface TransactionState {
  status: TransactionStatus;
  error?: string;
}

export function useTransactionStatus() {
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<
    Map<string, TransactionState>
  >(new Map());

  const monitorTransaction = useCallback(
    async (signature: TransactionSignature, referenceKey?: PublicKey) => {
      try {
        setTransactions((prev) =>
          new Map(prev).set(signature, { status: "pending" })
        );

        // If there's a reference key, wait for it to appear
        if (referenceKey) {
          const result = await connection.confirmTransaction({
            signature,
            blockhash: await connection
              .getLatestBlockhash()
              .then((res) => res.blockhash),
            lastValidBlockHeight: await connection.getBlockHeight(),
          });

          if (result.value.err) {
            throw new Error(
              "Transaction failed: " + result.value.err.toString()
            );
          }

          // Check if the reference key exists
          const references = await connection.getParsedTransactions([
            signature,
          ]);
          const hasReference =
            references[0]?.transaction.message.accountKeys.some((key) =>
              key.pubkey.equals(referenceKey)
            );

          if (!hasReference) {
            throw new Error("Transaction reference key not found");
          }
        }

        // Monitor main transaction
        const confirmationStatus = await connection.confirmTransaction(
          signature
        );

        setTransactions((prev) =>
          new Map(prev).set(signature, {
            status: confirmationStatus.value.err ? "failed" : "confirmed",
            error: confirmationStatus.value.err?.toString(),
          })
        );

        return {
          status: confirmationStatus.value.err ? "failed" : "confirmed",
          error: confirmationStatus.value.err?.toString(),
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setTransactions((prev) =>
          new Map(prev).set(signature, {
            status: "failed",
            error: errorMessage,
          })
        );
        return { status: "failed", error: errorMessage };
      }
    },
    [connection]
  );

  const getTransactionStatus = useCallback(
    (signature: string) => {
      return transactions.get(signature);
    },
    [transactions]
  );

  return {
    monitorTransaction,
    getTransactionStatus,
    transactions,
  };
}
