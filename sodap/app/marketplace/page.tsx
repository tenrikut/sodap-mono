"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SodapProvider } from "../contexts/SodapContext";
import StoreScan from "../components/shopping/StoreScan";
import ProductScanner from "../components/shopping/ProductScanner";
import { ShoppingCartProvider } from "../contexts/ShoppingCartContext";
import { CartProvider } from "../contexts/CartContext";
import CartList from "../components/cart/CartList";
import { usePayment } from "../utils/payment";
import { motion } from "framer-motion";

export default function Marketplace() {
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [scanningMode, setScanningMode] = useState<"store" | "product" | null>(
    "store"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleStoreScanned = (storeId: string) => {
    setIsLoading(true);
    // Simulate loading for better UX
    setTimeout(() => {
      setActiveStore(storeId);
      setScanningMode("product");
      setIsLoading(false);
    }, 800);
  };

  const exitShoppingSession = () => {
    setIsLoading(true);
    // Simulate loading for better UX
    setTimeout(() => {
      setActiveStore(null);
      setScanningMode("store");
      setIsLoading(false);
    }, 500);
  };

  const { handlePayment } = usePayment();

  return (
    <SodapProvider>
      <ShoppingCartProvider>
        <CartProvider>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            <div className="container mx-auto px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center mb-6"
              ></motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white shadow-xl rounded-2xl p-8 mb-6"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-purple-700 font-medium">
                      Loading...
                    </p>
                  </div>
                ) : !activeStore ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {scanningMode === "store" && (
                      <div className="bg-purple-50 p-6 rounded-xl mb-6">
                        <StoreScan onStoreScanned={handleStoreScanned} />
                      </div>
                    )}

                    {/* Demo button for easy testing */}
                    <div className="mt-6 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStoreScanned("demo-store-123")}
                        className="bg-purple-600 text-white py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center"
                      >
                        Demo: Enter Store
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-purple-900">
                          Shopping at
                        </h2>
                        <div className="flex items-center mt-1">
                          <span className="text-lg font-medium text-purple-800">
                            {activeStore}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={exitShoppingSession}
                        className="px-4 py-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Exit Shopping
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-purple-50 p-6 rounded-xl shadow-sm"
                      >
                        <div className="mb-4">
                          <h3 className="text-xl font-medium text-purple-900">
                            Scan Products
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Scan product barcodes to add them to your cart.
                        </p>
                        {scanningMode === "product" && (
                          <ProductScanner storeId={activeStore} />
                        )}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-purple-50 p-6 rounded-xl shadow-sm"
                      >
                        <div className="mb-4">
                          <h3 className="text-xl font-medium text-purple-900">
                            Your Cart
                          </h3>
                        </div>
                        <CartList onConfirm={handlePayment} />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </CartProvider>
      </ShoppingCartProvider>
    </SodapProvider>
  );
}
