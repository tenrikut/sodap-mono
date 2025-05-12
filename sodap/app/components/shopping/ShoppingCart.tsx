"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useShoppingCart } from "../../contexts/ShoppingCartContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Keypair } from "@solana/web3.js";
import Receipt from "./Receipt";
import { usePayment } from "../../utils/payment";
import { useSolanaPay } from "../../hooks/useSolanaPay";
import { PaymentErrorBoundary } from "./PaymentErrorBoundary";
import { ErrorInfo } from "react";
import { TransactionStatus } from "./TransactionStatus";
import { useTransactionStatus } from "../../hooks/useTransactionStatus";

interface ShoppingCartProps {
  storeId: string;
}

interface CartReceipt {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  transactionId: string;
  timestamp: number;
  loyaltyPointsEarned: number;
}

export default function ShoppingCart({ storeId }: ShoppingCartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<CartReceipt | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentTx, setCurrentTx] = useState<string | null>(null);
  const { publicKey, connected } = useWallet();
  const { handlePayment, isProcessing, paymentResult } = usePayment();
  const { qrElement, generateQR, clearQR } = useSolanaPay();
  const { getTransactionStatus } = useTransactionStatus();

  const {
    cartItems,
    subtotal,
    totalItems,
    updateQuantity,
    removeFromCart,
    checkout,
    loyaltyBalance,
  } = useShoppingCart();

  // Create a ref for the QR code container
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Effect to append QR code element when it's generated
  useEffect(() => {
    if (qrElement && qrContainerRef.current) {
      qrContainerRef.current.innerHTML = "";
      qrContainerRef.current.appendChild(qrElement);
    }
  }, [qrElement]);

  const handlePaymentError = (error: Error, errorInfo: ErrorInfo) => {
    console.error("Payment error:", error, errorInfo);
    setPaymentError(error.message);
    clearQR();
  };

  const handleCheckout = async () => {
    if (!connected) {
      alert("Please connect your wallet first");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);
    try {
      const receiptData = await checkout();
      if (receiptData) {
        setReceipt(receiptData as CartReceipt);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSolanaPay = async () => {
    if (!connected || cartItems.length === 0) return;

    try {
      const storePublicKey = new PublicKey(storeId);
      const reference = Keypair.generate().publicKey;

      // Generate QR code
      const qr = await generateQR(storePublicKey, subtotal, reference);
      if (!qr) {
        throw new Error("Failed to generate QR code");
      }

      const result = await handlePayment(storePublicKey);
      if (result.success && result.transactionId) {
        setCurrentTx(result.transactionId);
        const txStatus = await getTransactionStatus(result.transactionId);

        if (txStatus?.status === "confirmed") {
          const receiptData: CartReceipt = {
            items: cartItems,
            total: subtotal,
            transactionId: result.transactionId,
            timestamp: Date.now(),
            loyaltyPointsEarned: Math.floor(subtotal * 1000), // 1000 points per SOL
          };
          setReceipt(receiptData);
          clearQR();
          setCurrentTx(null);
        }
      }
    } catch (error) {
      console.error("Payment failed:", error);
      setPaymentError(
        error instanceof Error ? error.message : "Payment failed"
      );
      clearQR();
    }
  };

  if (receipt) {
    return <Receipt receipt={receipt} onClose={() => setReceipt(null)} />;
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Your Cart ({totalItems} items)</h3>
        <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
          Your Loyalty Points: {loyaltyBalance}
        </div>
      </div>

      {!connected ? (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">Connect your wallet to checkout</p>
          <WalletMultiButton />
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-gray-500 mt-2">
            Scan products to add them to your cart
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-60 overflow-y-auto mb-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b"
              >
                <div className="flex items-center">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-md mr-3"
                    />
                  )}
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.price} SOL each
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center border rounded-md mr-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-medium">{subtotal.toFixed(3)} SOL</span>
            </div>

            <div className="flex justify-between mb-4">
              <span>Loyalty Rewards:</span>
              <span className="text-green-600">
                +{Math.floor(subtotal * 1000)} points
              </span>
            </div>

            <div className="space-y-3">
              <PaymentErrorBoundary onError={handlePaymentError}>
                {paymentError && (
                  <div className="mb-3 p-3 bg-red-50 text-red-600 rounded text-sm">
                    {paymentError}
                  </div>
                )}

                {currentTx && getTransactionStatus(currentTx) && (
                  <TransactionStatus
                    status={getTransactionStatus(currentTx)!.status}
                    signature={currentTx}
                    error={getTransactionStatus(currentTx)!.error}
                  />
                )}

                <button
                  onClick={handleSolanaPay}
                  disabled={isProcessing || !!currentTx}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-md font-medium transition disabled:opacity-50 relative"
                >
                  {isProcessing && (
                    <span className="absolute inset-0 flex items-center justify-center bg-purple-600 bg-opacity-50">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  )}
                  {isProcessing
                    ? "Processing..."
                    : `Pay with Solana Pay (${subtotal.toFixed(3)} SOL)`}
                </button>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !!currentTx}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium transition disabled:opacity-50 relative"
                >
                  {isCheckingOut && (
                    <span className="absolute inset-0 flex items-center justify-center bg-green-600 bg-opacity-50">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  )}
                  {isCheckingOut
                    ? "Processing..."
                    : `Checkout with Wallet (${subtotal.toFixed(3)} SOL)`}
                </button>
              </PaymentErrorBoundary>
            </div>
          </div>

          {qrElement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Scan to Pay</h3>
                <div ref={qrContainerRef} className="mb-4" />
                <button
                  onClick={clearQR}
                  className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
