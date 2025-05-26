import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { ReturnRequest } from './useReturnRequests';
import { handleWalletError } from '@/lib/walletErrorHandler';
import { monitorTransaction } from '@/lib/transactionMonitor';

export interface RefundTransactionResult {
  signature: string;
  status: 'success' | 'failed' | 'pending';
}

export const useRefundTransaction = () => {
  const { connection } = useConnection();
  const { publicKey: storeWallet, signTransaction } = useWallet();

  const processRefund = useCallback(async (purchase: any): Promise<RefundTransactionResult> => {
    // Extract buyer wallet address from the purchase object
    let buyerWallet;
    try {
      if (purchase.buyerAddress) {
        buyerWallet = new PublicKey(purchase.buyerAddress);
      } else {
        throw new Error('Buyer wallet address is missing or invalid');
      }
    } catch (error) {
      console.error('Error creating buyer PublicKey:', error);
      throw new Error('Invalid buyer wallet address');
    }
    
    try {
      if (!storeWallet || !signTransaction) {
        throw new Error('Store wallet not connected');
      }

      // Check store wallet balance first to ensure sufficient funds
      const balance = await connection.getBalance(storeWallet);
      console.log(`Store wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      
      // Calculate total refund amount
      const refundAmount = purchase.items.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );
      
      // Convert SOL to lamports
      const lamportsToSend = Math.round(refundAmount * LAMPORTS_PER_SOL);
      console.log(`Attempting to refund: ${refundAmount} SOL (${lamportsToSend} lamports)`);
      
      // Check if we have enough balance (including fees)
      const estimatedFee = 5000; // Estimated transaction fee in lamports
      if (balance < (lamportsToSend + estimatedFee)) {
        throw new Error(`Insufficient funds for refund. Need at least ${(lamportsToSend + estimatedFee) / LAMPORTS_PER_SOL} SOL, but have ${balance / LAMPORTS_PER_SOL} SOL`);
      }

      // Create refund transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: storeWallet,
          toPubkey: buyerWallet,
          lamports: lamportsToSend,
        })
      );

      // Get latest blockhash with higher priority
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = storeWallet;

      console.log('Transaction created, requesting signature...');
      // Sign and send transaction
      const signed = await signTransaction(transaction);
      console.log('Transaction signed, sending to network...');
      
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      console.log('Transaction sent, signature:', signature);
      console.log('Waiting for confirmation...');

      // Wait for transaction confirmation with timeout
      const status = await monitorTransaction(connection, signature, undefined, {
        timeout: 90000, // 90 seconds timeout
        interval: 2000 // Check every 2 seconds
      });
      
      console.log('Transaction status:', status);

      // Return result
      return {
        signature,
        status: status === 'success' ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      const errorMessage = handleWalletError(error);
      toast.error(errorMessage || 'Failed to process refund. Please check wallet balance and try again.');
      throw error;
    }
  }, [connection, storeWallet, signTransaction]);

  return { processRefund };
};
