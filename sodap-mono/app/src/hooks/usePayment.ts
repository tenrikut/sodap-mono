import { useAnchor } from "@/hooks/useAnchor";
import { CartItem } from "@/types/cart";
import { Keypair, PublicKey, TransactionResponse } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { toast } from "sonner";

export interface PaymentResult {
  transactionSignature: string;
  receiptAddress: string;
  storeAddress: string;
  buyerAddress: string;
  totalAmount: number;
  timestamp: number;
  confirmed: boolean;
}

export const usePayment = () => {
  const { program, walletAddress, connection } = useAnchor();

  const processPayment = async (cartItems: CartItem[], storeId: string): Promise<PaymentResult> => {
    // Early validation of required dependencies
    if (!program) {
      console.error("Program not initialized in usePayment hook");
      toast.error("Payment system not initialized");
      throw new Error("Program not initialized");
    }

    if (!walletAddress) {
      console.error("Wallet not connected");
      toast.error("Please connect your wallet");
      throw new Error("Wallet not connected");
    }

    if (!connection) {
      console.error("No connection to Solana network");
      toast.error("Network connection error");
      throw new Error("No connection to Solana network");
    }

    try {
      // Get store data from localStorage
      const storeData = localStorage.getItem(`sodap-store-wallet-${storeId}`);
      if (!storeData) {
        throw new Error(`Store data not found for store ${storeId}`);
      }

      // Parse store data to get store wallet and owner wallet
      const { pda: storeWallet, pub: storeOwnerWallet } = JSON.parse(storeData);
      if (!storeWallet || !storeOwnerWallet) {
        throw new Error('Invalid store wallet data');
      }

      // Create a new receipt account
      const receipt = Keypair.generate();

      // Calculate total amount in lamports
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const totalAmountLamports = new BN(totalAmount * 1e9);

      // Convert cart items to the format expected by the program
      const productIds = cartItems.map(item => new PublicKey(item.product.id));
      const quantities = cartItems.map(item => new BN(item.quantity));

      // Calculate gas fee (estimate)
      const gasFee = new BN(5000); // 0.000005 SOL

      // Create the transaction with the correct accounts
      // Send the transaction
      const tx = await program.methods
        .purchaseCart(
          productIds,
          quantities.map(q => new BN(q)),
          totalAmountLamports
        )
        .accounts({
          store: new PublicKey(storeWallet),
          receipt: receipt.publicKey,
          buyer: new PublicKey(walletAddress)
        })
        .signers([receipt])
        .rpc();

      console.log('Transaction sent:', tx);

      // Wait for transaction confirmation
      const confirmation = await connection.confirmTransaction(tx, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      // Get transaction details
      const txDetails = await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txDetails) {
        throw new Error('Failed to fetch transaction details');
      }

      // Return detailed payment result
      const result: PaymentResult = {
        transactionSignature: tx,
        receiptAddress: receipt.publicKey.toString(),
        storeAddress: storeWallet,
        buyerAddress: walletAddress,
        totalAmount: totalAmount,
        timestamp: txDetails.blockTime ? txDetails.blockTime : Math.floor(Date.now() / 1000),
        confirmed: true
      };

      toast.success("Payment processed and confirmed successfully!");
      return result;
    } catch (error) {
      console.error("Payment processing error:", error);
      
      // Provide more specific error messages
      let errorMessage = "Payment processing failed";
      if (error instanceof Error) {
        if (error.message.includes("insufficient")) {
          errorMessage = "Insufficient funds for this purchase";
        } else if (error.message.includes("not found")) {
          errorMessage = "Store or product not found";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  return { processPayment };
};
