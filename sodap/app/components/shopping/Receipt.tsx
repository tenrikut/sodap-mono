"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface ReceiptProps {
  receipt: {
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
  };
  onClose: () => void;
}

export default function Receipt({ receipt, onClose }: ReceiptProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { publicKey } = useWallet();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return address.slice(0, 6) + "..." + address.slice(-4);
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-green-600">Purchase Complete</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-600">
            Your transaction has been processed successfully
          </p>
          <p className="text-sm text-gray-500">
            {formatDate(receipt.timestamp)}
          </p>
        </div>

        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Transaction ID:</span>
            <span className="font-mono text-sm">{receipt.transactionId}</span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">Wallet:</span>
            <span className="font-mono text-sm">
              {publicKey ? formatAddress(publicKey.toString()) : "Unknown"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total:</span>
            <span className="font-bold">{receipt.total.toFixed(3)} SOL</span>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 6h10M7 18h10"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold">
              You earned {receipt.loyaltyPointsEarned} loyalty points!
            </h4>
            <p className="text-sm text-gray-600">
              Points can be used for discounts on future purchases.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <span>{showDetails ? "Hide" : "Show"} purchase details</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ml-1 transform ${
              showDetails ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-3">
            <h4 className="font-medium mb-2">Purchased Items:</h4>
            <div className="max-h-60 overflow-y-auto">
              {receipt.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toFixed(3)} SOL</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
