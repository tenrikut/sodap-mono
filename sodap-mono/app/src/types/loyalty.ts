import { PublicKey } from '@solana/web3.js';

export interface LoyaltyConfig {
  pointsPerDollar: number;
  redemptionRate: number;
}

export interface LoyaltyMint {
  store: PublicKey;
  mint: PublicKey;
  authority: PublicKey;
  pointsPerSol: number;
  redemptionRate: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  isToken2022: boolean;
}

export interface LoyaltyState {
  balance: number;
  mintAddress: PublicKey | null;
  isInitialized: boolean;
  loading: boolean;
  error: Error | null;
}

export interface LoyaltyTransaction {
  id: string;
  timestamp: number;
  amount: number;
  type: 'earn' | 'redeem';
  transactionSignature: string;
}

export type LoyaltyContextType = {
  loyaltyState: LoyaltyState;
  initializeLoyalty: (store: PublicKey) => Promise<void>;
  earnPoints: (amount: number, purchase: PublicKey) => Promise<void>;
  redeemPoints: (amount: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  transactions: LoyaltyTransaction[];
};
