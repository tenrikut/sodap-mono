"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SodapContext } from "./SodapContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Receipt {
  items: CartItem[];
  total: number;
  transactionId: string;
  timestamp: number;
  loyaltyPointsEarned: number;
}

interface ShoppingCartContextType {
  cartItems: CartItem[];
  loyaltyBalance: number;
  purchaseHistory: Receipt[];
  addToCart: (product: any, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: () => Promise<Receipt | null>;
  totalItems: number;
  subtotal: number;
}

const ShoppingCartContext = createContext<ShoppingCartContextType>({
  cartItems: [],
  loyaltyBalance: 0,
  purchaseHistory: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  checkout: async () => null,
  totalItems: 0,
  subtotal: 0,
});

export const ShoppingCartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState<Receipt[]>([]);

  const wallet = useWallet();
  const { getProducts } = useContext(SodapContext);

  // Add item to cart
  const addToCart = (product: any, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if product already in cart
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.imageUrl,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Checkout process
  const checkout = async (): Promise<Receipt | null> => {
    if (!wallet.connected || cartItems.length === 0) {
      return null;
    }

    try {
      // In a real app, this would make blockchain transaction
      // For this demo, we'll simulate the transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Calculate loyalty points (1 point per 0.1 SOL spent)
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const loyaltyPointsEarned = Math.floor(total * 10);

      // Create receipt
      const receipt: Receipt = {
        items: [...cartItems],
        total,
        transactionId: `tx-${Math.random().toString(36).substring(2, 10)}`,
        timestamp: Date.now(),
        loyaltyPointsEarned,
      };

      // Update purchase history
      setPurchaseHistory((prev) => [receipt, ...prev]);

      // Update loyalty balance
      setLoyaltyBalance((prev) => prev + loyaltyPointsEarned);

      // Clear cart after successful purchase
      clearCart();

      return receipt;
    } catch (error) {
      console.error("Checkout failed:", error);
      return null;
    }
  };

  // Calculate total items in cart
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate subtotal
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <ShoppingCartContext.Provider
      value={{
        cartItems,
        loyaltyBalance,
        purchaseHistory,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
};

export const useShoppingCart = () => useContext(ShoppingCartContext);
