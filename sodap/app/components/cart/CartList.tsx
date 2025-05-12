"use client";

import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import SolanaPayCheckout from "./SolanaPayCheckout";

interface CartListProps {
  onConfirm?: () => void;
}

export default function CartList({ onConfirm }: CartListProps) {
  const { items, removeItem, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckoutClick = () => {
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    if (onConfirm) {
      onConfirm();
    }
    setShowCheckout(false);
    clearCart();
  };

  const handleCheckoutError = (error: Error) => {
    console.error("Checkout error:", error);
    setShowCheckout(false);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <p className="text-gray-500 text-center py-6">Your cart is empty</p>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <SolanaPayCheckout
        onSuccess={handleCheckoutSuccess}
        onError={handleCheckoutError}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="py-4 flex justify-between">
            <div className="flex items-center">
              {item.imageUrl && (
                <div className="flex-shrink-0 h-10 w-10 mr-3 relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">
                  {item.quantity} x ${item.price.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-4">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-base font-medium">
          <p>Subtotal</p>
          <p>${totalAmount.toFixed(2)}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          Shipping and taxes calculated at checkout.
        </p>
      </div>

      <div className="mt-6">
        <button
          onClick={handleCheckoutClick}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
        >
          Checkout with Solana Pay
        </button>
        <button
          onClick={clearCart}
          className="w-full mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}
