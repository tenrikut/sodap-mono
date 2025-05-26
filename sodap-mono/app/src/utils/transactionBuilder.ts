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
  import.meta.env.VITE_SOLANA_RPC_URL ||
  "https://api.devnet.solana.com"; // Default to Devnet if no network is specified

/**
 * Create a purchase transaction for the cart
 * Using AnchorContext's connection and program instead of creating new ones
 */
export const createPurchaseTransaction = async (
  cartItems: CartItem[],
  total: number,
  storeId: string,
  connection: Connection,
  program: Program,
  walletPublicKey: PublicKey
): Promise<Transaction> => {
  // Create a new transaction
  const transaction = new Transaction();

  console.log("CREATING REAL DEVNET TRANSACTION - NO SIMULATION");
  console.log(`Total amount: ${total} SOL`);
  console.log(`Store ID: ${storeId}`);
  console.log(`Wallet: ${walletPublicKey.toString()}`);

  try {
    // Validate inputs
    if (!connection) throw new Error("Connection not established");
    if (!program) throw new Error("Program not initialized");
    if (!walletPublicKey) throw new Error("Wallet public key not provided");
    if (!storeId) throw new Error("Store ID not provided");

    // Create a real transaction for Devnet
    console.log(
      "Creating real Devnet transaction with program:",
      program.programId.toString()
    );

    // Convert store ID to PublicKey
    const storePublicKey = new PublicKey(storeId);
    console.log("Using store ID:", storePublicKey.toString());

    try {
      // Convert amount to lamports
      const amountLamports = new BN(total * LAMPORTS_PER_SOL);
      console.log("Payment amount (lamports):", amountLamports.toString());

      // Create a proper purchase transaction using the program's purchaseCart instruction
      console.log("CREATING PURCHASE TRANSACTION FOR DEVNET");
      console.log("Program ID:", program.programId.toString());
      console.log("Store ID:", storePublicKey.toString());
      console.log("Buyer:", walletPublicKey.toString());
      console.log("Amount Lamports:", amountLamports.toString());
      
      // Find the store PDA and escrow PDA
      const storePDA = findStorePDA(storePublicKey);
      const escrowPDA = findEscrowPDA(storePDA);
      
      // Create a receipt PDA for this purchase
      const receipt = findReceiptPDA(walletPublicKey, storePublicKey);
      
      // Convert cart items to the format expected by the program
      const productIds = cartItems.map(item => new PublicKey(item.product.id));
      const quantities = cartItems.map(item => new BN(item.quantity));
      
      console.log("Store PDA:", storePDA.toString());
      console.log("Escrow PDA:", escrowPDA.toString());
      console.log("Receipt PDA:", receipt.toString());
      
      // Add the purchase instruction
      const purchaseIx = await program.methods
        .purchaseCart(
          productIds,
          quantities,
          amountLamports
        )
        .accounts({
          store: storePDA,
          escrowAccount: escrowPDA,
          receipt: receipt,
          buyer: walletPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      transaction.add(purchaseIx);
      
      console.log("Added purchase instruction to transaction");

      // Add recent blockhash
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
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
    // FORCE SENDING REAL TRANSACTION TO DEVNET
    console.log("SENDING REAL TRANSACTION TO SOLANA DEVNET - NO SIMULATION");
    console.log("Connection RPC URL:", connection.rpcEndpoint);
    console.log("Is Devnet being used:", connection.rpcEndpoint.includes("devnet"));
    
    // Note: In Vite, we can't modify import.meta.env at runtime
    // but we can check the mode and handle accordingly
    const isProd = import.meta.env.PROD; // This is true in production mode

    // For production mode, get the wallet from window.phantom.solana
    const wallet = window.phantom?.solana;
    if (!wallet) {
      throw new Error("Phantom wallet not connected");
    }

    // Sign the transaction
    console.log("Signing transaction with wallet");
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send the signed transaction
    console.log("Sending transaction to network");
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    console.log("Transaction sent, signature:", signature);

    // Confirm the transaction with a longer timeout
    console.log("Waiting for confirmation");
    
    // Use a more robust confirmation strategy with a longer timeout
    const latestBlockhash = await connection.getLatestBlockhash();
    const confirmationStrategy = {
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: signature
    };
    
    try {
      // Increase the timeout to 60 seconds (default is 30)
      const confirmation = await connection.confirmTransaction(confirmationStrategy, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction confirmed but failed: ${confirmation.value.err}`);
      }
      
      console.log("Transaction confirmed");
    } catch (confirmError) {
      console.error("Confirmation error:", confirmError);
      
      // Even if confirmation times out, the transaction might still be successful
      // Let's check the transaction status directly
      try {
        const status = await connection.getSignatureStatus(signature);
        if (status && status.value && !status.value.err) {
          console.log("Transaction appears to be successful despite confirmation timeout");
          // Continue as if confirmed
        } else if (status && status.value && status.value.err) {
          throw new Error(`Transaction failed: ${status.value.err}`);
        } else {
          throw new Error("Transaction status unknown");
        }
      } catch (statusError) {
        console.error("Status check error:", statusError);
        throw new Error(`Transaction may have failed or is still pending. Check signature ${signature} on Solana Explorer.`);
      }
    }
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
