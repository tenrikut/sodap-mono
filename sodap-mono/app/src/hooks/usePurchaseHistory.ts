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

  // This function is kept for backward compatibility but no longer generates demo purchases
  const generateDemoPurchases = useCallback(() => {
    return [];
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
          } else {
            // If cached purchases are empty or invalid, show empty state
            setPurchases([]);
          }
        } catch (err) {
          console.error('Error parsing cached purchases:', err);
          // If there's an error parsing cached purchases, show empty state
          setPurchases([]);
        }
      } else {
        // If no cached purchases exist, show empty state
        console.log('No cached purchases found');
        setPurchases([]);
      }
      
      // Try to fetch from blockchain if wallet is connected
      if (connection && walletAddress) {
        try {
          console.log('Fetching purchases from blockchain for wallet:', walletAddress.toString());
          
          // Get recent signatures for the wallet - increase limit to 30 for more history
          const walletPublicKey = new PublicKey(walletAddress);
          const signatures = await connection.getSignaturesForAddress(
            walletPublicKey,
            { limit: 30 } // Increased from 10 to 30
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
                
                // More lenient check for purchase transactions
                // In a real app, you would check for specific program IDs
                const isPurchase = tx.meta.logMessages?.some(
                  msg => {
                    const msgLower = msg.toLowerCase();
                    return msgLower.includes("purchase") || 
                           msgLower.includes("payment") || 
                           msgLower.includes("buy") || 
                           msgLower.includes("transaction") ||
                           msgLower.includes("sodap");
                  }
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
              
              // We only want to show real purchases, no demo data
              
              // Update state with all purchases
              setPurchases(allPurchases);
              
              // Save to localStorage
              localStorage.setItem("sodap-purchases", JSON.stringify(allPurchases));
              console.log('Saved purchases to localStorage');
              
              setIsLoading(false);
              return;
            } else {
              // If no purchases were found in blockchain transactions
              console.log('No purchases found in blockchain');
              // Keep using cached purchases if available, otherwise show empty state
              if (cachedPurchases.length === 0) {
                setPurchases([]);
              }
            }
          } else {
            // If no signatures were found
            console.log('No signatures found for wallet');
            // Keep using cached purchases if available, otherwise show empty state
            if (cachedPurchases.length === 0) {
              setPurchases([]);
            }
          }
        } catch (err) {
          console.error('Error fetching from blockchain:', err);
          // Continue to use cached or demo data
          if (cachedPurchases.length === 0) {
            setPurchases([]);
          }
        }
      } else {
        // If no wallet is connected, make sure we're using demo data
        if (cachedPurchases.length === 0) {
          console.log('No wallet connected');
          setPurchases([]);
        }
      }
    } catch (err) {
      console.error('Error in fetchPurchases:', err);
      setError(`Error fetching purchases: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Show empty state as fallback
      setPurchases([]);
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
    console.log('Adding new purchase to history:', newPurchase.id);
    
    // First, get the latest purchases from localStorage to ensure we have the most up-to-date data
    let currentPurchases: Purchase[] = [];
    try {
      const storedPurchases = localStorage.getItem("sodap-purchases");
      if (storedPurchases) {
        const parsed = JSON.parse(storedPurchases);
        if (Array.isArray(parsed)) {
          currentPurchases = parsed;
        }
      }
    } catch (err) {
      console.error('Error reading current purchases from localStorage:', err);
    }
    
    // Check if this purchase already exists (to avoid duplicates)
    const purchaseExists = currentPurchases.some(p => p.id === newPurchase.id);
    if (purchaseExists) {
      console.log('Purchase already exists in history, not adding duplicate');
      return;
    }
    
    // Add the new purchase to the beginning of the array
    const updated = [newPurchase, ...currentPurchases];
    
    // Save to localStorage
    localStorage.setItem("sodap-purchases", JSON.stringify(updated));
    console.log('Saved updated purchase history to localStorage with new purchase');
    
    // Update state
    setPurchases(updated);
    
    // Dispatch a custom event to notify other components that a purchase was added
    const purchaseEvent = new CustomEvent('sodap-purchase-added', { 
      detail: { purchase: newPurchase } 
    });
    window.dispatchEvent(purchaseEvent);
    
    return updated;
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
