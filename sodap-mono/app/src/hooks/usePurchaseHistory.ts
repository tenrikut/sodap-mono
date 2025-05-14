import { useState, useEffect, useCallback } from "react";
import { useAnchor } from "./useAnchor";
import { toast } from "sonner";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PaymentResult } from "./usePayment";

interface ExtendedPaymentResult extends PaymentResult {
  storeId?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  storeName?: string;
  date?: string;
}
import bs58 from "bs58";

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
}

export const usePurchaseHistory = () => {
  const { program, walletAddress, connection } = useAnchor();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached purchases first
  useEffect(() => {
    const cachedPurchases = sessionStorage.getItem("cachedPurchases");
    if (cachedPurchases) {
      setPurchases(JSON.parse(cachedPurchases));
    }
  }, []);

  // Load return requests to mark returned items
  useEffect(() => {
    const storedRequests = sessionStorage.getItem("returnRequests");
    if (storedRequests) {
      const returnRequests = JSON.parse(storedRequests);
      setPurchases((prev) =>
        prev.map((purchase) => ({
          ...purchase,
          isReturned: returnRequests.some(
            (req) => req.purchaseId === purchase.id
          ),
        }))
      );
    }
  }, []);

  // Function to fetch a single purchase by its transaction signature
  const fetchSinglePurchase = useCallback(
    async (
      receiptAddress: string,
      txSignature?: string
    ): Promise<Purchase | null> => {
      if (!program || !connection) {
        throw new Error("Program or connection not initialized");
      }

      console.log("fetchSinglePurchase called with:", {
        receiptAddress,
        txSignature,
      });

      try {
        if (!txSignature) {
          throw new Error("Transaction signature is required");
        }

        // Get transaction data
        const tx = await connection.getTransaction(txSignature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          throw new Error("Transaction not found");
        }

        console.log("Transaction data:", tx);

        // Get store name from session storage
        const selectedStoreName = sessionStorage.getItem("selectedStoreName") || "Unknown Store";
        
        // Calculate total amount from transaction
        const totalAmount = tx.meta?.postBalances && tx.meta?.preBalances ?
          (tx.meta.preBalances[0] - tx.meta.postBalances[0]) / LAMPORTS_PER_SOL :
          0;

        // Create purchase data from transaction
        const purchase: Purchase = {
          id: txSignature,
          storeName: selectedStoreName,
          date: new Date(
            tx.blockTime ? tx.blockTime * 1000 : Date.now()
          ).toISOString(),
          items: [], // We don't have item details yet
          totalAmount,
          transactionSignature: txSignature,
        };

        return purchase;
      } catch (err) {
        console.error("Error fetching single purchase:", err);
        return null;
      }
    },
    [program, connection]
  );

  const fetchPurchases = useCallback(async (): Promise<void> => {
    console.log("fetchPurchases called with:", {
      program: !!program,
      walletAddress: walletAddress?.toString(),
      connection: !!connection,
    });

    if (!program || !walletAddress || !connection) {
      console.log("Missing required dependencies");
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "Fetching purchase history for wallet:",
        walletAddress.toString()
      );
      console.log("Using program ID:", program.programId.toString());

      // Check if we need to fetch new transactions
      const lastFetchTime = sessionStorage.getItem("lastPurchaseFetchTime");
      const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
      
      if (lastFetchTime && Date.now() - parseInt(lastFetchTime) < FETCH_INTERVAL) {
        console.log("Using cached purchases, too soon to fetch new ones");
        return;
      }

      // Get recent transactions for the wallet
      console.log("Fetching recent transactions for wallet:", walletAddress.toString());
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(walletAddress.toString()),
        { limit: 10 } // Reduced from 20 to 10 to avoid rate limits
      );

      console.log("Found signatures:", signatures.length);
      
      // Update last fetch time
      sessionStorage.setItem("lastPurchaseFetchTime", Date.now().toString());

      // Get transaction details and filter for payments
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            });
            return { signature: sig.signature, tx };
          } catch (err) {
            console.error("Error fetching transaction:", err);
            return null;
          }
        })
      );

      // Filter for valid payment transactions
      const validPurchases = transactions
        .filter((tx): tx is NonNullable<typeof tx> => 
          tx !== null && 
          tx.tx !== null && 
          tx.tx.meta?.postBalances !== undefined && 
          tx.tx.meta?.preBalances !== undefined
        )
        .filter(tx => {
          // Check if this is a payment transaction (balance decreased)
          const balanceChange = (tx.tx.meta?.preBalances[0] ?? 0) - (tx.tx.meta?.postBalances[0] ?? 0);
          return balanceChange > 0; // Only include transactions where balance decreased
        });

      console.log("Valid payment transactions:", validPurchases.length);

      // Transform transactions into purchase format
      const transformedPurchases = await Promise.all(
        validPurchases.map(async ({ signature, tx }) => {
          try {
            console.log("Transforming transaction:", signature);
            const purchase = await fetchSinglePurchase(
              signature,
              signature
            );
            console.log("Transformed purchase:", purchase);
            return purchase;
          } catch (err) {
            console.error("Error transforming purchase:", err);
            return null;
          }
        })
      );

      // Filter out any null results and sort by date
      const validTransformedPurchases = transformedPurchases
        .filter((p): p is Purchase => p !== null)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      setPurchases(validTransformedPurchases);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Failed to fetch purchase history");
      toast.error("Failed to fetch purchase history");
    } finally {
      setIsLoading(false);
    }
  }, [program, walletAddress, connection, fetchSinglePurchase]);

  const addNewPurchase = useCallback(async (purchaseData: Purchase): Promise<void> => {
    console.log("Adding new purchase with data:", purchaseData);
    if (!program || !walletAddress) {
      console.error('Cannot add purchase: program or wallet not connected');
      setError("Wallet not connected");
      return;
    }

    // Update state and cache immediately
    setPurchases(prev => [purchaseData, ...prev]);
    const cachedPurchases = JSON.parse(sessionStorage.getItem("cachedPurchases") || "[]");
    sessionStorage.setItem("cachedPurchases", JSON.stringify([purchaseData, ...cachedPurchases]));

    try {
      const fetchedPurchase = await fetchSinglePurchase(
        purchaseData.transactionSignature,
        purchaseData.transactionSignature
      );
      if (fetchedPurchase) {
        setPurchases((prev) => [fetchedPurchase, ...prev]);
      }
    } catch (err) {
      console.error("Error adding new purchase:", err);
      toast.error("Failed to update purchase history");
    }
  }, [program, walletAddress, fetchSinglePurchase, setPurchases]);

  // Fetch real purchases when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      console.log('Wallet connected, fetching purchases for:', walletAddress.toString());
      fetchPurchases();
    } else {
      console.log('No wallet connected, skipping purchase fetch');
    }
  }, [walletAddress, fetchPurchases]);

  // Update purchase status when a return request is created
  useEffect(() => {
    const handleRefundRequestUpdate = () => {
      // Get return requests
      const returnRequestsStr = sessionStorage.getItem('returnRequests');
      if (!returnRequestsStr) return;

      try {
        const returnRequests = JSON.parse(returnRequestsStr);
        // Mark purchases as returned if they have a return request
        const updatedPurchases = purchases.map(purchase => ({
          ...purchase,
          isReturned: returnRequests.some(req => req.purchaseId === purchase.id)
        }));
        setPurchases(updatedPurchases);
      } catch (err) {
        console.error('Error updating purchase status:', err);
      }
    };

    // Listen for return request updates
    window.addEventListener('refundRequestUpdate', handleRefundRequestUpdate);
    return () => window.removeEventListener('refundRequestUpdate', handleRefundRequestUpdate);
  }, [purchases]);

  return {
    purchases,
    isLoading,
    error,
    refetch: fetchPurchases,
    addNewPurchase,
    fetchSinglePurchase,
  };
};
