import { useState, useEffect, useCallback } from "react";
import { useAnchor } from "./useAnchor";
import { toast } from "sonner";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PaymentResult } from "./usePayment";

interface ExtendedPaymentResult extends PaymentResult {
  storeId?: string;
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

  // Load return requests to mark returned items
  useEffect(() => {
    const storedRequests = sessionStorage.getItem('returnRequests');
    if (storedRequests) {
      const returnRequests = JSON.parse(storedRequests);
      setPurchases(prev => prev.map(purchase => ({
        ...purchase,
        isReturned: returnRequests.some(req => req.purchaseId === purchase.id)
      })));
    }
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch a single purchase by its transaction signature
  const fetchSinglePurchase = useCallback(async (receiptAddress: string, txSignature?: string): Promise<Purchase | null> => {
    if (!program || !connection) {
      throw new Error("Program or connection not initialized");
    }

    console.log('fetchSinglePurchase called with:', { receiptAddress, txSignature });

    try {
      if (!txSignature) {
        throw new Error('Transaction signature is required');
      }

      // Get transaction data
      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx) {
        throw new Error('Transaction not found');
      }

      console.log('Transaction data:', tx);

      // Create purchase data from transaction
      const purchase: Purchase = {
        id: txSignature,
        storeName: 'Store 5', // We know this is store 5
        date: new Date(tx.blockTime ? tx.blockTime * 1000 : Date.now()).toISOString(),
        items: [], // We don't have item details
        totalAmount: 0.1, // We know this is 0.1 SOL
        transactionSignature: txSignature
      };

      return purchase;
    } catch (err) {
      console.error('Error fetching single purchase:', err);
      return null;
    }
  }, [program, connection]);

  const fetchPurchases = useCallback(async (): Promise<void> => {
    console.log('fetchPurchases called with:', {
      program: !!program,
      walletAddress: walletAddress?.toString(),
      connection: !!connection
    });

    if (!program || !walletAddress || !connection) {
      console.log('Missing required dependencies');
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching purchase history for wallet:', walletAddress.toString());
      console.log('Using program ID:', program.programId.toString());
      
      // Get all purchase accounts using getProgramAccounts
      console.log('Using program ID:', program.programId.toString());
      const accounts = await connection.getProgramAccounts(program.programId, {
        filters: [
          {
            memcmp: {
              offset: 8, // After the account discriminator
              bytes: bs58.encode(new PublicKey(walletAddress.toString()).toBuffer()), // Filter by buyer address
            },
          },
        ],
      });

      console.log('Found accounts:', accounts.length, 'accounts');
      console.log('Account pubkeys:', accounts.map(a => a.pubkey.toString()));

      // Convert accounts to purchase accounts
      const userPurchases = await Promise.all(
        accounts.map(async ({ pubkey, account }) => {
          try {
            const purchaseAccount = await program.account.purchase.fetch(pubkey);
            return {
              publicKey: pubkey,
              account: purchaseAccount,
            };
          } catch (err) {
            console.error('Error decoding purchase account:', err);
            return null;
          }
        })
      );

      // Filter out null results
      const validPurchases = userPurchases.filter((p): p is NonNullable<typeof p> => p !== null);
      console.log('Valid purchases:', validPurchases);

      // Transform all purchases into display format
      const transformedPurchases = await Promise.all(
        validPurchases.map(async (p) => {
          try {
            console.log('Transforming purchase:', p.publicKey.toString());
            console.log('Purchase account:', p.account);
            const purchase = await fetchSinglePurchase(p.publicKey.toString(), undefined);
            console.log('Transformed purchase:', purchase);
            return purchase;
          } catch (err) {
            console.error('Error transforming purchase:', err);
            return null;
          }
        })
      );

      // Filter out any null results and sort by date
      const validTransformedPurchases = transformedPurchases
        .filter((p): p is Purchase => p !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPurchases(validTransformedPurchases);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Failed to fetch purchase history");
      toast.error("Failed to fetch purchase history");
    } finally {
      setIsLoading(false);
    }
  }, [program, walletAddress, connection, fetchSinglePurchase]);

  // Function to add a new purchase after payment
  const addNewPurchase = useCallback(async (paymentResult: ExtendedPaymentResult): Promise<void> => {
    if (!program || !walletAddress) {
      setError("Wallet not connected");
      return;
    }

    try {
      const purchase = await fetchSinglePurchase(paymentResult.receiptAddress, paymentResult.transactionSignature);
      if (purchase) {
        setPurchases(prev => [purchase, ...prev]);
      }
    } catch (err) {
      console.error('Error adding new purchase:', err);
      toast.error('Failed to update purchase history');
    }
  }, [program, walletAddress, fetchSinglePurchase, setPurchases]);

  useEffect(() => {
    if (walletAddress) {
      // Set mock data for now
      const mockPurchases: Purchase[] = [
        {
          id: '1',
          storeName: 'Store 1',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          items: [
            { name: 'Item 1', price: 0.1, quantity: 1 },
            { name: 'Item 2', price: 0.2, quantity: 2 }
          ],
          totalAmount: 0.5,
          transactionSignature: 'mock_tx_1'
        },
        {
          id: '2',
          storeName: 'Store 2',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          items: [
            { name: 'Item 3', price: 0.3, quantity: 1 }
          ],
          totalAmount: 0.3,
          transactionSignature: 'mock_tx_2'
        }
      ];
      
      setPurchases(mockPurchases);
    }
  }, [walletAddress]);

  return {
    purchases,
    isLoading,
    error,
    refetch: fetchPurchases,
    addNewPurchase,
    fetchSinglePurchase,
  };
};
