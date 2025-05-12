// Store-related types
export interface Store {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
}

// Product-related types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
  category?: string;
  tokenizedType: "None" | "SplToken";
  isActive: boolean;
  createdAt?: number;
}

// User-related types
export interface UserProfile {
  userId: string;
  walletAddress: string;
  loyaltyBalance: number;
  purchaseHistory: PurchaseRecord[];
  preferredStore?: string;
  deliveryAddress?: string;
  registeredAt: number;
}

export interface PurchaseRecord {
  storeId: string;
  transactionId: string;
  amount: number;
  loyaltyEarned: number;
  timestamp: number;
}

export interface Receipt {
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

// Blockchain integration types
export interface ProductUUID {
  uuid: string; // UUID in string format
}

export interface ProductWithUUID extends Product {
  uuid: string; // The on-chain UUID
}

// --- Admin Management Types ---
export interface PlatformAdmin {
  walletAddress: string;
  addedAt: number;
}

export interface SuperRootAdmin {
  username: string;
  password: string;
  walletAddress: string;
}

export type AdminAction = "add" | "remove";

// --- Auth Types ---
export interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthError {
  message: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Import the Sodap type from the target directory
import { Sodap } from "../../target/types/sodap";
export type { Sodap };
