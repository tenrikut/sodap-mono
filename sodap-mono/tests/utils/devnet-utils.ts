import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';

/**
 * Fund a test account with SOL from the provider's wallet
 * This is used for devnet testing to avoid airdrop rate limits
 */
export async function fundTestAccount(
  provider: AnchorProvider,
  destination: PublicKey,
  amountSol: number = 1
): Promise<string> {
  const connection = provider.connection;
  const payer = provider.wallet;
  
  // Create a transaction to transfer SOL
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: destination,
      lamports: amountSol * LAMPORTS_PER_SOL,
    })
  );

  // Get the latest blockhash for the transaction
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;

  // Sign and send the transaction
  try {
    // Use the provider's wallet to sign and send the transaction
    const signature = await provider.sendAndConfirm(transaction);
    console.log(`Funded ${destination.toString()} with ${amountSol} SOL. Signature: ${signature}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    
    // Verify the balance was updated
    const balance = await connection.getBalance(destination);
    console.log(`New balance for ${destination.toString()}: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    return signature;
  } catch (error) {
    console.error(`Error funding account ${destination.toString()}:`, error);
    throw error;
  }
}

/**
 * Fund multiple test accounts with SOL from the provider's wallet
 */
export async function fundMultipleTestAccounts(
  provider: AnchorProvider,
  accounts: Keypair[],
  amountSolEach: number = 0.1
): Promise<string[]> {
  const signatures: string[] = [];
  
  for (const account of accounts) {
    try {
      // Check current balance first
      const currentBalance = await provider.connection.getBalance(account.publicKey);
      console.log(`Current balance of ${account.publicKey.toString()}: ${currentBalance / LAMPORTS_PER_SOL} SOL`);
      
      // Only fund if balance is low
      if (currentBalance < amountSolEach * LAMPORTS_PER_SOL / 2) {
        const signature = await fundTestAccount(provider, account.publicKey, amountSolEach);
        signatures.push(signature);
        
        // Add a small delay between transactions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`Account ${account.publicKey.toString()} already has sufficient funds`);
      }
    } catch (error) {
      console.error(`Failed to fund account ${account.publicKey.toString()}:`, error);
    }
  }
  
  return signatures;
}

/**
 * Check if an account has enough SOL
 */
export async function hasEnoughSol(
  connection: Connection,
  account: PublicKey,
  minimumSolBalance: number = 0.5
): Promise<boolean> {
  try {
    const balance = await connection.getBalance(account);
    return balance >= minimumSolBalance * LAMPORTS_PER_SOL;
  } catch (error) {
    console.error(`Error checking balance for ${account.toString()}:`, error);
    return false;
  }
}

/**
 * Fund an account only if it doesn't have enough SOL
 */
export async function ensureAccountFunded(
  provider: AnchorProvider,
  account: PublicKey,
  targetSolBalance: number = 1
): Promise<boolean> {
  const connection = provider.connection;
  
  try {
    const balance = await connection.getBalance(account);
    const currentSolBalance = balance / LAMPORTS_PER_SOL;
    
    if (currentSolBalance < targetSolBalance) {
      const amountToFund = targetSolBalance - currentSolBalance;
      await fundTestAccount(provider, account, amountToFund);
      return true;
    }
    
    console.log(`Account ${account.toString()} already has ${currentSolBalance} SOL, no funding needed`);
    return false;
  } catch (error) {
    console.error(`Error ensuring account ${account.toString()} is funded:`, error);
    return false;
  }
}
