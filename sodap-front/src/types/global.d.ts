// src/types/global.d.ts

import type { PublicKey, Transaction } from "@solana/web3.js";

// Define the Phantom wallet interface
interface PhantomProvider {
  isPhantom: boolean;
  isUnlocked: () => Promise<boolean>;
  connect: (opts?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
  }
}

// Make this file a module to ensure it gets picked up
export {};
