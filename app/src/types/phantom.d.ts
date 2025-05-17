// src/types/phantom.d.ts

import type { PublicKey, Transaction } from "@solana/web3.js";

export interface PhantomWalletProvider {
  isPhantom: boolean;
  connect(opts?: { onlyIfTrusted: boolean }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  isUnlocked(): Promise<boolean>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomWalletProvider;
    };
  }
}
