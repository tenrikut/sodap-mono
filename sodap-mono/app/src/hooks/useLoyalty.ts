import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from './use-toast';
import { useProgram } from './useProgram';
import { 
  LoyaltyState, 
  LoyaltyTransaction,
  LoyaltyMint 
} from '../types/loyalty';
import * as anchor from '@coral-xyz/anchor';

export const useLoyalty = (storeAddress?: PublicKey) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { toast } = useToast();

  const [state, setState] = useState<LoyaltyState>({
    balance: 0,
    mintAddress: null,
    isInitialized: false,
    loading: false,
    error: null,
  });

  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);

  // Get the PDA for loyalty mint
  const getLoyaltyMintPDA = useCallback(async (store: PublicKey) => {
    if (!program) return null;
    
    const [loyaltyMintPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('loyalty_mint'),
        store.toBuffer(),
      ],
      program.programId
    );
    
    return loyaltyMintPDA;
  }, [program]);

  // Initialize loyalty for a store
  const initializeLoyalty = useCallback(async (store: PublicKey) => {
    if (!program || !publicKey) {
      throw new Error('Program or wallet not connected');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const loyaltyMintPDA = await getLoyaltyMintPDA(store);
      if (!loyaltyMintPDA) throw new Error('Could not derive loyalty mint PDA');

      // Check if loyalty mint already exists
      const loyaltyMintAccount = await program.account.loyaltyMint.fetch(loyaltyMintPDA);
      
      if (loyaltyMintAccount) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          mintAddress: loyaltyMintAccount.mint,
          loading: false,
        }));
        return;
      }

      // If not initialized, create new loyalty mint
      const tx = await program.methods
        .initializeLoyaltyMint({
          pointsPerSol: new anchor.BN(100), // Default 100 points per SOL
          redemptionRate: new anchor.BN(100), // Default 100 points = 1 SOL
        })
        .accounts({
          store,
          loyaltyMintAccount: loyaltyMintPDA,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx);

      setState(prev => ({
        ...prev,
        isInitialized: true,
        loading: false,
      }));

      toast({
        title: "Loyalty Program Initialized",
        description: "Your store's loyalty program has been set up successfully.",
      });

    } catch (error) {
      console.error('Error initializing loyalty:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      toast({
        title: "Error",
        description: "Failed to initialize loyalty program",
        variant: "destructive",
      });
    }
  }, [program, publicKey, connection, getLoyaltyMintPDA, toast]);

  // Fetch loyalty points balance
  const refreshBalance = useCallback(async () => {
    if (!program || !publicKey || !storeAddress) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const loyaltyMintPDA = await getLoyaltyMintPDA(storeAddress);
      if (!loyaltyMintPDA) throw new Error('Could not derive loyalty mint PDA');

      const loyaltyMintAccount = await program.account.loyaltyMint.fetch(loyaltyMintPDA);
      
      // For now, we'll use a simplified balance calculation
      // In production, you'd want to fetch the actual token balance
      const balance = loyaltyMintAccount.totalPointsIssued.sub(
        loyaltyMintAccount.totalPointsRedeemed
      ).toNumber();

      setState(prev => ({
        ...prev,
        balance,
        mintAddress: loyaltyMintAccount.mint,
        loading: false,
      }));

    } catch (error) {
      console.error('Error fetching loyalty balance:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [program, publicKey, storeAddress, getLoyaltyMintPDA]);

  // Earn points from a purchase
  const earnPoints = useCallback(async (amount: number, purchase: PublicKey) => {
    if (!program || !publicKey || !storeAddress) {
      throw new Error('Program, wallet, or store not connected');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const loyaltyMintPDA = await getLoyaltyMintPDA(storeAddress);
      if (!loyaltyMintPDA) throw new Error('Could not derive loyalty mint PDA');

      const tx = await program.methods
        .mintLoyaltyTokens({
          amount: new anchor.BN(amount),
          purchaseId: purchase,
        })
        .accounts({
          store: storeAddress,
          loyaltyMintAccount: loyaltyMintPDA,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx);

      // Add transaction to history
      setTransactions(prev => [{
        id: tx,
        timestamp: Date.now(),
        amount,
        type: 'earn',
        transactionSignature: tx,
      }, ...prev]);

      await refreshBalance();

      toast({
        title: "Points Earned",
        description: `You've earned ${amount} loyalty points!`,
      });

    } catch (error) {
      console.error('Error earning points:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      toast({
        title: "Error",
        description: "Failed to earn points",
        variant: "destructive",
      });
    }
  }, [program, publicKey, storeAddress, connection, getLoyaltyMintPDA, refreshBalance, toast]);

  // Redeem points
  const redeemPoints = useCallback(async (amount: number) => {
    if (!program || !publicKey || !storeAddress) {
      throw new Error('Program, wallet, or store not connected');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const loyaltyMintPDA = await getLoyaltyMintPDA(storeAddress);
      if (!loyaltyMintPDA) throw new Error('Could not derive loyalty mint PDA');

      const tx = await program.methods
        .redeemLoyaltyPoints({
          amount: new anchor.BN(amount),
        })
        .accounts({
          store: storeAddress,
          loyaltyMintAccount: loyaltyMintPDA,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx);

      // Add transaction to history
      setTransactions(prev => [{
        id: tx,
        timestamp: Date.now(),
        amount,
        type: 'redeem',
        transactionSignature: tx,
      }, ...prev]);

      await refreshBalance();

      toast({
        title: "Points Redeemed",
        description: `You've redeemed ${amount} loyalty points!`,
      });

    } catch (error) {
      console.error('Error redeeming points:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      toast({
        title: "Error",
        description: "Failed to redeem points",
        variant: "destructive",
      });
    }
  }, [program, publicKey, storeAddress, connection, getLoyaltyMintPDA, refreshBalance, toast]);

  // Initial load
  useEffect(() => {
    if (storeAddress) {
      refreshBalance();
    }
  }, [storeAddress, refreshBalance]);

  return {
    loyaltyState: state,
    initializeLoyalty,
    earnPoints,
    redeemPoints,
    refreshBalance,
    transactions,
  };
};
