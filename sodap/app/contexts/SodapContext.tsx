"use client";

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  Store,
  Product,
  UserProfile,
  PurchaseRecord,
  Receipt,
  PlatformAdmin,
  SuperRootAdmin,
  AdminAction,
} from "../types/sodap";

import { v4 as uuidv4 } from "uuid";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  addPlatformAdminOnChain,
  removePlatformAdminOnChain,
  fetchPlatformAdmins,
  PROGRAM_ID,
  getConnection,
} from "../utils/solana";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";

interface SodapContextType {
  userRole: any;
  store: Store | null;
  userProfile: UserProfile | null;
  createStore: (name: string, description: string) => Promise<void>;
  updateStore: (name: string, description: string) => Promise<void>;
  getProducts: () => Promise<Product[]>;
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  scanStore: (storeId: string) => Promise<Store>;
  scanProduct: (productId: string) => Promise<Product>;
  purchaseCart: (
    items: Array<{ productId: string; quantity: number }>
  ) => Promise<Receipt>;
  getLoyaltyBalance: () => Promise<number>;
  redeemLoyaltyPoints: (amount: number) => Promise<void>;
  createOrUpdateUserProfile: (
    userId?: string,
    deliveryAddress?: string,
    preferredStore?: string
  ) => Promise<void>;
  generateUUID: () => string;
  convertUUIDToBytes: (uuid: string) => Uint8Array;
  convertBytesToUUID: (bytes: Uint8Array) => string;
  walletConnected: boolean;
  platformAdmins: PlatformAdmin[];
  addPlatformAdmin: (
    admin: PlatformAdmin,
    username: string,
    password: string
  ) => Promise<void>;
  removePlatformAdmin: (
    walletAddress: string,
    username: string,
    password: string
  ) => Promise<void>;
  superRootAdmin: SuperRootAdmin | null;
  loginSuperRootAdmin: (username: string, password: string) => Promise<boolean>;
  logoutSuperRootAdmin: () => void;
}

// Create the context with a default value
export const SodapContext = createContext<SodapContextType>({
  userRole: null,
  store: null,
  userProfile: null,
  createStore: async () => {},
  updateStore: async () => {},
  getProducts: async () => [],
  addProduct: async () => {},
  updateProduct: async () => {},
  removeProduct: async () => {},
  scanStore: async () => ({
    id: "",
    name: "",
    description: "",
    isActive: false,
  }),
  scanProduct: async () => ({
    id: "",
    name: "",
    description: "",
    price: 0,
    inventory: 0,
    imageUrl: "",
    category: "",
    tokenizedType: "None",
    isActive: false,
  }),
  purchaseCart: async () => ({
    items: [],
    total: 0,
    transactionId: "",
    timestamp: 0,
    loyaltyPointsEarned: 0,
  }),
  getLoyaltyBalance: async () => 0,
  redeemLoyaltyPoints: async () => {},
  createOrUpdateUserProfile: async () => {},
  generateUUID: () => "",
  convertUUIDToBytes: () => new Uint8Array(16),
  convertBytesToUUID: () => "",
  walletConnected: false,
  platformAdmins: [],
  addPlatformAdmin: async () => {},
  removePlatformAdmin: async () => {},
  superRootAdmin: null,
  loginSuperRootAdmin: async () => false,
  logoutSuperRootAdmin: () => {},
});

// Mock data for demo
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Solana T-Shirt",
    description: "Limited edition Solana-branded t-shirt",
    price: 0.5,
    inventory: 100,
    imageUrl: "https://via.placeholder.com/150",
    category: "Apparel",
    tokenizedType: "None",
    isActive: true,
    createdAt: Date.now() - 8640000,
  },
  {
    id: "2",
    name: "Crypto Coffee Mug",
    description: "Ceramic coffee mug with crypto designs",
    price: 0.2,
    inventory: 50,
    imageUrl: "https://via.placeholder.com/150",
    category: "Household",
    tokenizedType: "None",
    isActive: true,
    createdAt: Date.now() - 8640000 * 2,
  },
];

// Provider component
export const SodapProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [platformAdmins, setPlatformAdmins] = useState<PlatformAdmin[]>([]);
  const [superRootAdmin, setSuperRootAdmin] = useState<SuperRootAdmin | null>(
    null
  );

  // Get wallet from the wallet adapter
  const { publicKey, connected } = useWallet();

  // Load user profile when wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      loadUserProfile(publicKey.toString());
    } else {
      setUserProfile(null);
    }
  }, [connected, publicKey]);

  // Simulate loading store data from blockchain
  useEffect(() => {
    // For demo purposes, we'll just set a mock store after a delay
    const loadStore = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStore({
        id: "1",
        name: "Crypto Collectibles",
        description: "Your one-stop shop for crypto merchandise",
        isActive: true,
      });
    };

    loadStore();
  }, []);

  // Load user profile data
  const loadUserProfile = async (walletAddress: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real implementation, this would fetch the user profile from blockchain
    setUserProfile({
      userId: `user-${walletAddress.substring(0, 8)}`,
      walletAddress: walletAddress,
      loyaltyBalance: 150,
      purchaseHistory: [
        {
          storeId: "1",
          transactionId: "tx-abc123",
          amount: 0.7,
          loyaltyEarned: 70,
          timestamp: Date.now() - 86400000, // 1 day ago
        },
      ],
      registeredAt: Date.now() - 2592000000, // 30 days ago
    });
  };

  // Create a new store
  const createStore = async (name: string, description: string) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain delay
    setStore({
      id: "1",
      name,
      description,
      isActive: true,
    });
  };

  // Update store details
  const updateStore = async (name: string, description: string) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain delay
    if (store) {
      setStore({
        ...store,
        name,
        description,
      });
    }
  };

  // Get all products for the store
  const getProducts = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate blockchain delay
    return products;
  };

  // Generate a random UUID for product registration
  const generateUUID = () => {
    return uuidv4();
  };

  // Convert a UUID string to byte array for on-chain storage
  const convertUUIDToBytes = (uuid: string): Uint8Array => {
    // Remove hyphens from UUID
    const hexString = uuid.replace(/-/g, "");

    // Convert hex string to byte array
    const byteArray = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      byteArray[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
    }

    return byteArray;
  };

  // Convert a byte array from on-chain storage back to UUID string
  const convertBytesToUUID = (bytes: Uint8Array): string => {
    // Convert byte array to hex string
    let hexString = "";
    for (let i = 0; i < bytes.length; i++) {
      const hex = bytes[i].toString(16).padStart(2, "0");
      hexString += hex;
    }

    // Format as UUID
    return [
      hexString.substring(0, 8),
      hexString.substring(8, 12),
      hexString.substring(12, 16),
      hexString.substring(16, 20),
      hexString.substring(20, 32),
    ].join("-");
  };

  // Add a new product
  const addProduct = async (product: Omit<Product, "id" | "createdAt">) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain delay
    const uuid = generateUUID();

    // In a real implementation, this would call register_product on the blockchain
    // with UUID converted to bytes
    const newProduct: Product = {
      ...product,
      id: uuid, // In a real implementation, this would be the UUID
      createdAt: Date.now(),
    };

    setProducts([...products, newProduct]);

    console.log("Registered product with UUID:", uuid);
    console.log("UUID as bytes (for blockchain):", convertUUIDToBytes(uuid));
  };

  // Update an existing product
  const updateProduct = async (id: string, productUpdate: Partial<Product>) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain delay

    // In a real implementation, this would call update_product on the blockchain
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, ...productUpdate } : product
      )
    );
  };

  // Remove a product
  const removeProduct = async (id: string) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain delay

    // In a real implementation, this would call deactivate_product on the blockchain
    const product = products.find((p) => p.id === id);
    if (product) {
      updateProduct(id, { isActive: false });
    }
  };

  // Scan a store QR code
  const scanStore = async (storeId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate blockchain delay
    return {
      id: storeId,
      name: "Scanned Store",
      description: "This store was scanned via QR code",
      isActive: true,
    };
  };

  // Scan a product QR code
  const scanProduct = async (productId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate blockchain delay
    const product = products.find((p) => p.id === productId);

    if (product) {
      return product;
    }

    // Return a mock product if not found
    return {
      id: productId,
      name: "Scanned Product",
      description: "This product was scanned via QR code",
      price: 0.35,
      inventory: 25,
      imageUrl: "https://via.placeholder.com/150",
      category: "Unknown",
      tokenizedType: "None" as "None" | "SplToken",
      isActive: true,
    };
  };

  // Purchase items in a cart
  const purchaseCart = async (
    items: Array<{ productId: string; quantity: number }>
  ) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate blockchain delay

    let total = 0;
    const purchasedItems = [];

    // Calculate total and prepare receipt items
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        total += product.price * item.quantity;
        purchasedItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });

        // Update inventory
        updateProduct(product.id, {
          inventory: Math.max(0, product.inventory - item.quantity),
        });
      }
    }

    // Calculate loyalty points (10 points per 0.1 SOL)
    const loyaltyPointsEarned = Math.floor(total * 100);

    // Update user's loyalty balance and purchase history
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        loyaltyBalance: userProfile.loyaltyBalance + loyaltyPointsEarned,
        purchaseHistory: [
          {
            storeId: store?.id || "unknown",
            transactionId: `tx-${Math.random().toString(36).substring(2, 10)}`,
            amount: total,
            loyaltyEarned: loyaltyPointsEarned,
            timestamp: Date.now(),
          },
          ...userProfile.purchaseHistory,
        ],
      });
    }

    // Create and return receipt
    return {
      items: purchasedItems,
      total,
      transactionId: `tx-${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      loyaltyPointsEarned,
    };
  };

  // Get user's loyalty balance
  const getLoyaltyBalance = async () => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate blockchain delay
    return userProfile?.loyaltyBalance || 0;
  };

  // Redeem loyalty points
  const redeemLoyaltyPoints = async (amount: number) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate blockchain delay

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.loyaltyBalance < amount) {
      throw new Error("Insufficient loyalty points");
    }

    setUserProfile({
      ...userProfile,
      loyaltyBalance: userProfile.loyaltyBalance - amount,
    });
  };

  // Create or update user profile
  const createOrUpdateUserProfile = async (
    userId?: string,
    deliveryAddress?: string,
    preferredStore?: string
  ) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain delay

    if (!userProfile) {
      // Create new profile
      setUserProfile({
        userId: userId || `user-${Math.random().toString(36).substring(2, 10)}`,
        walletAddress: publicKey.toString(),
        loyaltyBalance: 0,
        purchaseHistory: [],
        deliveryAddress,
        preferredStore,
        registeredAt: Date.now(),
      });
    } else {
      // Update existing profile
      setUserProfile({
        ...userProfile,
        userId: userId || userProfile.userId,
        deliveryAddress: deliveryAddress || userProfile.deliveryAddress,
        preferredStore: preferredStore || userProfile.preferredStore,
      });
    }
  };

  // Super Root Admin login (stub, not secure)
  const loginSuperRootAdmin = async (username: string, password: string) => {
    if (username === "super-admin" && password === "sodap*root") {
      setSuperRootAdmin({
        username,
        password,
        walletAddress: "11111111111111111111111111111111",
      });
      return true;
    }
    return false;
  };
  const logoutSuperRootAdmin = () => setSuperRootAdmin(null);

  // Helper to get Anchor program instance
  const getAnchorProgram = async () => {
    const connection = await getConnection();
    // For demo: use window.solana or a local keypair for SRA
    // In production, use wallet adapter provider
    const provider = new AnchorProvider(connection, (window as any).solana, {});
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const idl = require("../../target/idl/sodap.json");
    return new Program(idl, PROGRAM_ID, provider);
  };

  // Fetch platform admins from chain
  const refreshPlatformAdmins = useCallback(async () => {
    try {
      const program = await getAnchorProgram();
      const adminPubkeys = await fetchPlatformAdmins(program);
      setPlatformAdmins(
        adminPubkeys.map((pk) => ({
          walletAddress: pk.toString(),
          addedAt: Date.now(),
        }))
      );
    } catch (e) {
      // fallback: keep local state
    }
  }, []);

  // Add Platform Admin (on-chain)
  const addPlatformAdmin = async (
    admin: PlatformAdmin,
    username: string,
    password: string
  ) => {
    const program = await getAnchorProgram();
    // For demo: use a local keypair for SRA
    const sraKeypair = web3.Keypair.generate(); // Replace with real SRA keypair
    await addPlatformAdminOnChain(
      program,
      sraKeypair,
      new web3.PublicKey(admin.walletAddress),
      username,
      password
    );
    await refreshPlatformAdmins();
  };
  // Remove Platform Admin (on-chain)
  const removePlatformAdmin = async (
    walletAddress: string,
    username: string,
    password: string
  ) => {
    const program = await getAnchorProgram();
    const sraKeypair = web3.Keypair.generate(); // Replace with real SRA keypair
    await removePlatformAdminOnChain(
      program,
      sraKeypair,
      new web3.PublicKey(walletAddress),
      username,
      password
    );
    await refreshPlatformAdmins();
  };

  // Fetch platform admins on SRA login
  useEffect(() => {
    if (superRootAdmin) {
      refreshPlatformAdmins();
    }
  }, [superRootAdmin, refreshPlatformAdmins]);

  return (
    <SodapContext.Provider
      value={{
        userRole: null, // TODO: Implement user role logic
        store,
        userProfile,
        createStore,
        updateStore,
        getProducts,
        addProduct,
        updateProduct,
        removeProduct,
        scanStore,
        scanProduct,
        purchaseCart,
        getLoyaltyBalance,
        redeemLoyaltyPoints,
        createOrUpdateUserProfile,
        generateUUID,
        convertUUIDToBytes,
        convertBytesToUUID,
        walletConnected: connected,
        platformAdmins,
        addPlatformAdmin,
        removePlatformAdmin,
        superRootAdmin,
        loginSuperRootAdmin,
        logoutSuperRootAdmin,
      }}
    >
      {children}
    </SodapContext.Provider>
  );
};
