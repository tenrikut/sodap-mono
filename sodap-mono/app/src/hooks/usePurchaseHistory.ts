import { useState, useEffect, useCallback } from "react";
import { useAnchor } from "./useAnchor";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";

export interface PurchaseItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Purchase {
  isReturned?: boolean;
  id: string;
  storeName: string;
  date: string;
  items: PurchaseItem[];
  transactionSignature: string;
  totalAmount: number;
  // Anchor required fields
  receiptAddress: string;
  storeAddress: string;
  buyerAddress: string;
  purchaseTimestamp: number;
  returnStatus?: 'Pending' | 'Approved' | 'Rejected';
  refundSignature?: string;
  refundDate?: string;
}

export const usePurchaseHistory = () => {
  const { program, walletAddress, connection } = useAnchor();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for storage events to update purchases in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sodap-purchases' && e.newValue) {
        try {
          const newPurchases = JSON.parse(e.newValue);
          console.log('Storage event: purchases updated', newPurchases.length);
          setPurchases(newPurchases);
        } catch (err) {
          console.error('Error handling storage change:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Generate demo purchases for testing if none exist
  const generateDemoPurchases = useCallback(() => {
    console.log('Generating demo purchases');
    const demoPurchases: Purchase[] = [
      {
        id: 'purchase_1',
        storeName: 'SoDap Demo Store',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        items: [
          { name: 'Digital Art Print', price: 0.5, quantity: 1 },
          { name: 'Premium Frame', price: 0.2, quantity: 1 }
        ],
        totalAmount: 0.7,
        transactionSignature: '5KKsWtpQ9XpHD7z1KeWEJgUGmGdXdmXZQYQ8zFEpJQrTQpfg4iNZJf1bHLwmQiR3GXxRL2HvuR8bMnKEqKFrFBU4',
        receiptAddress: 'receipt_1',
        storeAddress: 'store_1',
        buyerAddress: 'buyer_1',
        purchaseTimestamp: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
      },
      {
        id: 'purchase_2',
        storeName: 'SoDap Art Gallery',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        items: [
          { name: 'Limited Edition NFT', price: 1.2, quantity: 1 }
        ],
        totalAmount: 1.2,
        transactionSignature: '4YUkwv1qNv3RyKMYFFE9yd44EC4FcYFXdNUWH9SYQbYkQaS2qz5eW7G2XcNLVhXHaFZ9j5sTnGsqNfYCmvJJKtBY',
        receiptAddress: 'receipt_2',
        storeAddress: 'store_2',
        buyerAddress: 'buyer_2',
        purchaseTimestamp: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
        isReturned: true,
        returnStatus: 'Pending'
      },
      {
        id: 'purchase_3',
        storeName: 'SoDap Collectibles',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        items: [
          { name: 'Rare Digital Collectible', price: 0.8, quantity: 1 },
          { name: 'Authentication Certificate', price: 0.1, quantity: 1 }
        ],
        totalAmount: 0.9,
        transactionSignature: '3KLsWtpQ9XpHD7z1KeWEJgUGmGdXdmXZQYQ8zFEpJQrTQpfg4iNZJf1bHLwmQiR3GXxRL2HvuR8bMnKEqKFrFBU4',
        receiptAddress: 'receipt_3',
        storeAddress: 'store_3',
        buyerAddress: 'buyer_3',
        purchaseTimestamp: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60,
        isReturned: true,
        returnStatus: 'Approved',
        refundSignature: '2YUkwv1qNv3RyKMYFFE9yd44EC4FcYFXdNUWH9SYQbYkQaS2qz5eW7G2XcNLVhXHaFZ9j5sTnGsqNfYCmvJJKtBY',
        refundDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      }
    ];
    
    return demoPurchases;
  }, []);

  // Fetch purchases from blockchain or localStorage
  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check localStorage for cached purchases
      const cachedPurchasesStr = localStorage.getItem("sodap-purchases");
      let cachedPurchases: Purchase[] = [];
      
      if (cachedPurchasesStr) {
        try {
          const parsed = JSON.parse(cachedPurchasesStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedPurchases = parsed;
            console.log('Found cached purchases:', cachedPurchases.length);
            // Set purchases from cache immediately while we try to fetch from blockchain
            setPurchases(cachedPurchases);
          }
        } catch (err) {
          console.error('Error parsing cached purchases:', err);
        }
      }
      
      // Try to fetch from blockchain if wallet is connected
      if (connection && walletAddress) {
        try {
          console.log('Fetching purchases from blockchain for wallet:', walletAddress.toString());
          
          // Get recent signatures for the wallet
          const signatures = await connection.getSignaturesForAddress(
            walletAddress,
            { limit: 10 }
          );
          
          if (signatures.length > 0) {
            console.log(`Found ${signatures.length} signatures`);
            
            // Process each signature to get transaction details
            const fetchedPurchases: Purchase[] = [];
            
            for (const sig of signatures) {
              try {
                if (!sig.signature || !sig.blockTime) continue;
                
                const tx = await connection.getTransaction(sig.signature, {
                  maxSupportedTransactionVersion: 0
                });
                
                if (!tx || !tx.meta) continue;
                
                // Simple check for purchase transactions
                // In a real app, you would check for specific program IDs
                const isPurchase = tx.meta.logMessages?.some(
                  msg => msg.includes("purchase") || msg.includes("payment")
                );
                
                if (!isPurchase) continue;
                
                // Create a purchase object from transaction data
                const purchase: Purchase = {
                  id: `purchase_${sig.signature.substring(0, 8)}`,
                  storeName: "SoDap Store", // This would come from transaction data in a real app
                  date: new Date(sig.blockTime * 1000).toISOString(),
                  items: [
                    // This would come from transaction data in a real app
                    { name: "Digital Item", price: 0.5, quantity: 1 }
                  ],
                  totalAmount: 0.5, // This would be calculated from transaction data
                  transactionSignature: sig.signature,
                  receiptAddress: "receipt_address", // This would come from transaction data
                  storeAddress: "store_address", // This would come from transaction data
                  buyerAddress: walletAddress.toString(),
                  purchaseTimestamp: sig.blockTime
                };
                
                fetchedPurchases.push(purchase);
              } catch (err) {
                console.error(`Error processing transaction ${sig.signature}:`, err);
              }
            }
            
            if (fetchedPurchases.length > 0) {
              console.log(`Processed ${fetchedPurchases.length} purchases from blockchain`);
              
              // Combine with cached purchases, avoiding duplicates
              const allPurchases = [...fetchedPurchases];
              
              // Add existing purchases that aren't duplicates
              cachedPurchases.forEach(existing => {
                if (!allPurchases.some(p => p.id === existing.id)) {
                  allPurchases.push(existing);
                }
              });
              
              // Update state with all purchases
              setPurchases(allPurchases);
              
              // Save to localStorage
              localStorage.setItem("sodap-purchases", JSON.stringify(allPurchases));
              console.log('Saved purchases to localStorage');
              
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching from blockchain:', err);
          // Continue to use cached or demo data
        }
      }
      
      // If we get here, either:
      // 1. No wallet is connected
      // 2. No blockchain purchases were found
      // 3. There was an error fetching from blockchain
      
      // If we have cached purchases, use those
      if (cachedPurchases.length > 0) {
        console.log('Using cached purchases');
        setPurchases(cachedPurchases);
      } else {
        // Otherwise use demo data
        console.log('No purchases found, using demo data');
        const demoPurchases = generateDemoPurchases();
        setPurchases(demoPurchases);
        localStorage.setItem("sodap-purchases", JSON.stringify(demoPurchases));
      }
    } catch (err) {
      console.error('Error in fetchPurchases:', err);
      setError(`Error fetching purchases: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Use demo data as fallback
      const demoPurchases = generateDemoPurchases();
      setPurchases(demoPurchases);
      localStorage.setItem("sodap-purchases", JSON.stringify(demoPurchases));
    } finally {
      setIsLoading(false);
    }
  }, [connection, walletAddress, generateDemoPurchases]);

  // Fetch purchases on mount and when wallet changes
  useEffect(() => {
    console.log('usePurchaseHistory hook initialized');
    fetchPurchases();
  }, [fetchPurchases]);

  // Function to refresh purchases manually
  const refreshPurchases = useCallback(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Function to update a purchase in the list
  const updatePurchase = useCallback((updatedPurchase: Purchase) => {
    setPurchases(prev => {
      const updated = prev.map(p => 
        p.id === updatedPurchase.id ? updatedPurchase : p
      );
      
      // Save to localStorage
      localStorage.setItem("sodap-purchases", JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Function to add a new purchase to the list
  const addPurchase = useCallback((newPurchase: Purchase) => {
    setPurchases(prev => {
      const updated = [newPurchase, ...prev];
      
      // Save to localStorage
      localStorage.setItem("sodap-purchases", JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  return {
    purchases,
    isLoading,
    error,
    refreshPurchases,
    updatePurchase,
    addPurchase
  };
};
