import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
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

  const processRefund = useCallback(async (
    returnRequest: ReturnRequest,
    buyerWallet: PublicKey
  ): Promise<RefundTransactionResult> => {
    try {
      if (!storeWallet || !signTransaction) {
        throw new Error('Store wallet not connected');
      }

      // Calculate total refund amount
      const refundAmount = returnRequest.items.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );

      // Create refund transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: storeWallet,
          toPubkey: buyerWallet,
          lamports: Math.round(refundAmount * 1e9), // Convert SOL to lamports
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = storeWallet;

      // Sign and send transaction
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      // Monitor transaction
      const status = await monitorTransaction(connection, signature);

      // Return result
      return {
        signature,
        status: status === 'success' ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      const errorMessage = handleWalletError(error);
      toast.error(errorMessage);
      throw error;
    }
  }, [connection, storeWallet, signTransaction]);

  return { processRefund };
};
