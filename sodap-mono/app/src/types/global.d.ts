// src/types/global.d.ts

import type { PublicKey, Transaction } from "@solana/web3.js";

declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        isUnlocked: () => Promise<boolean>;
        connect: (opts?: {
          onlyIfTrusted?: boolean;
        }) => Promise<{ publicKey: PublicKey }>;
        disconnect: () => Promise<void>;
        signTransaction: (tx: Transaction) => Promise<Transaction>;
        signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
      };
    };
  }
}

// Make this file a module to ensure it gets picked up
export {};
