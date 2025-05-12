import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { Sodap } from "@/idl/sodap";
import { toast } from "sonner";
import { IDL } from "@/idl";
import { PROGRAM_ID } from "@/utils/anchor";
import {
  findStorePDA,
  findEscrowPDA,
  findReceiptPDA,
  findLoyaltyMintPDA,
  solToLamports,
} from "@/utils/pdaHelpers";

// Define a type for the Phantom wallet
interface PhantomWallet {
  publicKey: PublicKey;
  isConnected: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<{ publicKey: PublicKey }>;
  isPhantom: boolean;
}

// Type for cart items
interface CartItem {
  product: {
    id: string;
    price: number;
    // other product fields...
  };
  quantity: number;
}

// Define the network connection - use environment variables with fallbacks
const SOLANA_NETWORK =
  import.meta.env.VITE_SOLANA_NETWORK ||
  process.env.REACT_APP_SOLANA_NETWORK ||
  "http://localhost:8999"; // Changed to use port 8999

/**
 * Create a purchase transaction for the cart
 * Using AnchorContext's connection and program instead of creating new ones
 *
 * Testing this on Solana devnet:
 * 1. Make sure your wallet has SOL on devnet (use https://solfaucet.com/)
 * 2. Connect your Phantom wallet to devnet network in settings
 * 3. The Store PDA should be properly initialized before making purchases
 * 4. For first-time users, the receipt PDA will be created during the transaction
 */
export const createPurchaseTransaction = async (
  cartItems: CartItem[],
  total: number,
  storeId: string,
  connection: Connection,
  program: Program<Sodap>,
  walletPublicKey: PublicKey
): Promise<Transaction> => {
  // Create a new transaction
  const transaction = new Transaction();

  try {
    console.log(
      "Creating Solana payment transaction with program:",
      program.programId.toString()
    );

    console.log("Cart items:", JSON.stringify(cartItems));
    console.log("Total amount:", total, "SOL");
    console.log("Store ID:", storeId);

    // Convert store ID to PublicKey
    const storePublicKey = new PublicKey(storeId);

    try {
      // Convert amount to lamports
      const amountLamports = new BN(solToLamports(total));

      // Find store account PDA for the store owner
      const storePDA = findStorePDA(storePublicKey);

      // Get escrow account PDA for this store
      const escrowAccount = findEscrowPDA(storePDA);

      // Find the receipt PDA for this purchase
      const receipt = findReceiptPDA(storePDA, walletPublicKey);

      // Find the loyalty mint PDA for this store
      const loyaltyMintInfo = findLoyaltyMintPDA(storePDA);

      console.log("Store PDA:", storePDA.toString());
      console.log("Escrow PDA:", escrowAccount.toString());
      console.log("Receipt PDA:", receipt.toString());
      console.log("Loyalty Mint PDA:", loyaltyMintInfo.toString());

      // Extract product IDs and quantities from cart items
      const productIds = cartItems.map(
        (item) => new PublicKey(item.product.id)
      );
      const quantities = cartItems.map((item) => new BN(item.quantity));

      // Add purchase instruction to the transaction
      transaction.add(
        program.instruction.purchaseCart(
          productIds,
          quantities,
          amountLamports,
          {
            accounts: {
              buyer: walletPublicKey,
              store: storePDA,
              receipt: receipt,
              storeOwner: storePublicKey,
              escrowAccount: escrowAccount,
              systemProgram: SystemProgram.programId,
              // Optional accounts below - can be included conditionally if needed
              loyaltyMintInfo: loyaltyMintInfo,
              tokenMint: null,
              tokenAccount: null,
              mintAuthority: null,
              tokenProgram: null,
            },
          }
        )
      );

      // Add recent blockhash
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash("confirmed")
      ).blockhash;
      transaction.feePayer = walletPublicKey;

      return transaction;
    } catch (error) {
      console.error("Error creating purchase instruction:", error);
      throw new Error(
        "Failed to create purchase instruction. The program may not support the purchaseCart method."
      );
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

/**
 * Send a transaction to the Solana blockchain
 * @param transaction Transaction to send
 * @returns Transaction signature
 */
export const sendTransaction = async (
  transaction: Transaction,
  connection: Connection
): Promise<string> => {
  try {
    // Always use real transactions on devnet, regardless of development mode
    console.log("Sending transaction to Solana network");

    // Get the wallet from window.phantom?.solana
    const wallet = window.phantom?.solana;
    if (!wallet) {
      throw new Error("Phantom wallet not connected");
    }

    // Sign the transaction
    console.log("Signing transaction with wallet");
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send the signed transaction
    console.log("Sending transaction to the network");
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: false, preflightCommitment: "confirmed" }
    );

    console.log("Transaction sent, signature:", signature);
    toast.info("Transaction sent to the Solana network");

    // Confirm the transaction with confirmed commitment
    console.log("Waiting for confirmation");
    toast.info("Waiting for transaction confirmation...");
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(
        `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
      );
    }

    console.log("Transaction confirmed");
    toast.success("Transaction confirmed successfully!");
    return signature;
  } catch (error) {
    console.error("Error sending transaction:", error);

    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("User rejected")) {
        throw new Error(
          "Transaction rejected by user. Please approve the transaction in your wallet."
        );
      } else if (error.message.includes("disconnected port")) {
        throw new Error(
          "Wallet connection was interrupted. Please reconnect your wallet and try again."
        );
      }
    }

    throw error;
  }
};
