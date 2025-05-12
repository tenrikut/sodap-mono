"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@chakra-ui/react";
import { createQR } from "@solana/pay";
import { encodeURL } from "@solana/pay";

// Adjust this to match your program ID
const SODAP_PROGRAM_ID = new PublicKey(
  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);
// This would be your store public key
const STORE_PUBLIC_KEY = new PublicKey("YourStorePublicKeyHere");

interface SolanaPayCheckoutProps {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const SolanaPayCheckout: React.FC<SolanaPayCheckoutProps> = ({
  onSuccess,
  onError,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { items, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Calculate total in SOL
  const totalPriceInSOL = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Convert to lamports
  const totalPriceInLamports = totalPriceInSOL * LAMPORTS_PER_SOL;

  // Create a QR code for mobile payments
  useEffect(() => {
    if (!publicKey) return;

    try {
      // Create a URL for the payment with required params
      const url = encodeURL({
        recipient: STORE_PUBLIC_KEY,
        amount: totalPriceInLamports / LAMPORTS_PER_SOL,
        reference: publicKey,
        label: "SoDap Store Purchase",
        message: `Payment for ${items.length} item(s)`,
        memo: `Purchase from SoDap: ${items.map((i) => i.name).join(", ")}`,
      });

      // Generate QR from the URL
      const qr = createQR(url);
      setQrCode(qr.toDataURL());
    } catch (error) {
      console.error("Error creating QR code:", error);
    }
  }, [publicKey, items, totalPriceInLamports]);

  const handlePayment = async () => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to proceed with payment",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create product IDs and quantities arrays for the transaction
      const productIds = items.map((item) => new PublicKey(item.id));
      const quantities = items.map((item) => item.quantity);

      // Fetch transaction data from the Solana Pay endpoint
      const response = await fetch("/api/solana-pay/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyer: publicKey.toString(),
          store: STORE_PUBLIC_KEY.toString(),
          products: productIds.map((id, i) => ({
            id: id.toString(),
            quantity: quantities[i],
          })),
          amount: totalPriceInLamports,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      const { transaction: serializedTransaction } = await response.json();

      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(serializedTransaction, "base64")
      );

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Confirm transaction
      const confirmationStatus = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmationStatus.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      // Handle success
      toast({
        title: "Payment successful",
        description: "Your payment has been processed successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Clear cart after successful payment
      clearCart();
      onSuccess();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      onError(
        error instanceof Error ? error : new Error("Unknown payment error")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <p className="text-center text-gray-600">
          Connect your wallet to complete the purchase
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">Complete Your Purchase</h2>

      <div className="flex flex-col space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-600">Connected Wallet</p>
          <p className="font-medium">
            {publicKey.toString().slice(0, 4)}...
            {publicKey.toString().slice(-4)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="font-medium">
            {totalPriceInSOL.toFixed(4)} SOL (≈${totalPriceInSOL * 30}.00)
          </p>
        </div>

        {qrCode && (
          <div className="flex justify-center my-4">
            <div className="bg-white p-3 rounded-md border">
              <img
                src={qrCode}
                alt="Solana Pay QR Code"
                className="w-48 h-48"
              />
              <p className="text-center text-sm mt-2">
                Scan with Phantom mobile app
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            isProcessing
              ? "bg-purple-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isProcessing ? "Processing Payment..." : "Pay with Phantom"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          By completing this purchase, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
};

export default SolanaPayCheckout;
