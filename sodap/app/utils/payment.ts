"use client";

import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createQR, encodeURL } from "@solana/pay";
import { processEscrowPayment, findEscrowAddress } from "./solana";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "../hooks/useAnchorProgram";
import { useTransactionStatus } from "../hooks/useTransactionStatus";

export interface PaymentResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const { items, clearCart } = useCart();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useAnchorProgram();
  const { monitorTransaction } = useTransactionStatus();

  const handlePayment = async (
    storePublicKey: PublicKey
  ): Promise<PaymentResult> => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      // Calculate total amount
      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // Find escrow PDA
      const [escrowPda] = await findEscrowAddress(storePublicKey);

      // Generate reference key for this transaction
      const reference = Keypair.generate().publicKey;

      // Generate Solana Pay URL with escrow instruction
      const url = encodeURL({
        link: new URL("https://sodap.app/pay"),
        label: "SoDap Purchase",
        message: `Purchase of ${items.length} items`,
        memo: "SoDap Transaction",
        recipient: escrowPda,
      });

      // Process escrow payment
      if (program && publicKey) {
        const tx = await processEscrowPayment(
          program,
          publicKey as any,
          storePublicKey,
          totalAmount
        );

        // Monitor transaction status
        const status = await monitorTransaction(tx, reference);

        if (status.status === "confirmed") {
          const result: PaymentResult = {
            success: true,
            transactionId: tx,
          };

          setPaymentResult(result);
          clearCart();

          return result;
        } else {
          throw new Error(status.error || "Transaction failed");
        }
      } else {
        throw new Error("Program or wallet not initialized");
      }
    } catch (error) {
      const errorResult: PaymentResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown payment error",
      };

      setPaymentResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handlePayment,
    isProcessing,
    paymentResult,
  };
}
