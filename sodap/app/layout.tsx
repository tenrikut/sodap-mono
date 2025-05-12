"use client";
// app/layout.tsx
import "./globals.css";
import { ChakraProvider } from "@chakra-ui/react";

import { SodapProvider } from "./contexts/SodapContext";
import SolanaWalletProvider from "./providers/WalletProvider";

import { Inter } from "next/font/google";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import GlobalNavBar from "./components/GlobalNavBar";
import GlobalFooter from "./components/GlobalFooter";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ChakraProvider>
          <AuthProvider>
            <SolanaWalletProvider>
              <SodapProvider>
                <CartProvider>
                  <GlobalNavBar />
                  <main className="flex-grow pb-24 container mx-auto px-4">
                    {children}
                  </main>
                  <GlobalFooter />
                </CartProvider>
              </SodapProvider>
            </SolanaWalletProvider>
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
