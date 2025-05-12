# Token-2022 Loyalty Program - MVP Implementation

This guide outlines the minimal implementation of a loyalty program using Token-2022 features, where users automatically receive 1 loyalty point for each 1 SOL spent.

## 1. Automatic Loyalty Token Setup

```typescript
import { PublicKey, Connection, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { 
  TOKEN_2022_PROGRAM_ID, 
  ExtensionType, 
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  getMintLen 
} from '@solana/spl-token-2022';

/**
 * Find the Loyalty Mint PDA for a store
 */
function findLoyaltyMintPDA(programId: PublicKey, storePubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('loyalty_mint'), storePubkey.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Create a non-transferable loyalty token mint for a store
 */
async function createLoyaltyTokenMint(
  connection: Connection,
  program: Program,
  payer: Keypair,
  storePublicKey: PublicKey
) {
  // Find the loyalty mint PDA
  const loyaltyMintPDA = findLoyaltyMintPDA(program.programId, storePublicKey);
  
  // Create transaction to initialize the mint with non-transferable extension
  const transaction = new Transaction();
  
  // Add the create loyalty mint with extensions instruction
  const createMintIx = await program.methods
    .createLoyaltyMint()
    .accounts({
      store: storePublicKey,
      loyaltyMint: loyaltyMintPDA,
      payer: payer.publicKey,
      tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  
  transaction.add(createMintIx);
  
  // Add the instruction to make it non-transferable
  const nonTransferableIx = createInitializeNonTransferableMintInstruction(
    loyaltyMintPDA,
    TOKEN_2022_PROGRAM_ID
  );
  
  transaction.add(nonTransferableIx);
  
  // Set recent blockhash and fee payer
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = payer.publicKey;
  
  // Sign and send transaction
  const signedTx = await payer.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  return loyaltyMintPDA;
}
```

## 2. Automatic Loyalty Point Minting

```typescript
/**
 * Mint loyalty points after a purchase (1 point per 1 SOL)
 */
async function mintLoyaltyPoints(
  connection: Connection,
  program: Program,
  wallet: any,
  storePublicKey: PublicKey,
  purchaseAmountSol: number
) {
  // Convert SOL to loyalty points (1:1 ratio)
  const loyaltyPoints = Math.floor(purchaseAmountSol);
  
  if (loyaltyPoints <= 0) {
    return null; // No points to mint
  }
  
  // Find the loyalty mint PDA
  const loyaltyMintPDA = findLoyaltyMintPDA(program.programId, storePublicKey);
  
  // Get or create the user's token account
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.publicKey,
    loyaltyMintPDA,
    wallet.publicKey,
    true,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  
  // Create transaction to mint loyalty points
  const transaction = new Transaction();
  
  // Add the mint loyalty points instruction
  const mintLoyaltyIx = await program.methods
    .mintLoyaltyPoints(new BN(loyaltyPoints))
    .accounts({
      store: storePublicKey,
      loyaltyMint: loyaltyMintPDA,
      authority: wallet.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      destination: userTokenAccount.address,
      payer: wallet.publicKey,
    })
    .instruction();
  
  transaction.add(mintLoyaltyIx);
  
  // Set recent blockhash and fee payer
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = wallet.publicKey;
  
  // Sign and send transaction
  const signedTx = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  return {
    signature,
    pointsMinted: loyaltyPoints
  };
}
```

## 3. Automatic Loyalty Integration with Checkout

```typescript
/**
 * Process purchase and automatically mint loyalty points
 */
async function processPurchaseWithLoyalty(
  connection: Connection,
  program: Program,
  wallet: any,
  storeOwnerPubkey: PublicKey,
  products: { uuid: string, quantity: number, price: number }[]
) {
  // Calculate total amount in SOL
  const totalAmount = products.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  
  // 1. First process the purchase
  const purchaseResult = await processPurchaseTransaction(
    program,
    connection,
    wallet,
    storeOwnerPubkey,
    products.map(item => ({ uuid: item.uuid, quantity: item.quantity })),
    totalAmount * LAMPORTS_PER_SOL
  );
  
  // 2. Then automatically mint loyalty points based on the amount spent
  const loyaltyResult = await mintLoyaltyPoints(
    connection,
    program,
    wallet,
    storeOwnerPubkey,
    totalAmount
  );
  
  return {
    purchase: purchaseResult,
    loyalty: loyaltyResult
  };
}
```

## 4. View-Only Loyalty Balance Component

```typescript
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token-2022';

/**
 * Display the user's loyalty point balance (view-only)
 */
export function LoyaltyBalance({ storePublicKey }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch loyalty balance
  const fetchLoyaltyBalance = async () => {
    if (!wallet.publicKey || !storePublicKey) return;
    
    setLoading(true);
    
    try {
      // Find the loyalty mint PDA
      const loyaltyMintPDA = findLoyaltyMintPDA(
        new PublicKey('4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv'), 
        typeof storePublicKey === 'string' ? new PublicKey(storePublicKey) : storePublicKey
      );
      
      // Get all token accounts owned by the user for this mint
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        wallet.publicKey,
        { mint: loyaltyMintPDA, programId: TOKEN_2022_PROGRAM_ID }
      );
      
      // Sum up the balances (usually there will be just one account)
      let totalPoints = 0;
      
      tokenAccounts.value.forEach(tokenAccount => {
        const accountInfo = AccountLayout.decode(tokenAccount.account.data);
        totalPoints += Number(accountInfo.amount);
      });
      
      setBalance(totalPoints);
    } catch (error) {
      console.error('Error fetching loyalty balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh balance when wallet or store changes
  useEffect(() => {
    fetchLoyaltyBalance();
  }, [wallet.publicKey, storePublicKey]);
  
  return (
    <div className="loyalty-balance">
      <h3>Your Loyalty Points</h3>
      {loading ? (
        <p>Loading balance...</p>
      ) : balance !== null ? (
        <div className="balance-display">
          <span className="points">{balance}</span>
          <span className="label">points</span>
        </div>
      ) : (
        <p>Connect your wallet to view points</p>
      )}
      <p className="info-text">
        You earn 1 loyalty point for every 1 SOL spent at our store.
      </p>
    </div>
  );
}
```

## 5. Key Token-2022 Features Used

### Non-Transferable Tokens

The loyalty tokens are created with the non-transferable extension, ensuring users cannot transfer their points to other users. This prevents abuse and ensures points stay with the customer who earned them.

```typescript
// Make the loyalty mint non-transferable
const nonTransferableIx = createInitializeNonTransferableMintInstruction(
  loyaltyMintPDA,
  TOKEN_2022_PROGRAM_ID
);
```

### Transfer Hook (Optional Enhanced Feature)

For advanced implementations, you can add a transfer hook that executes whenever loyalty tokens are redeemed:

```typescript
// Define a transfer hook for loyalty redemption events
const transferHookIx = createInitializeTransferHookInstruction(
  loyaltyMintPDA,
  authority.publicKey,
  redemptionHookPDA, // Your hook program address
  TOKEN_2022_PROGRAM_ID
);
```

## Implementation Steps

1. **Create the Loyalty Mint**: Initialize a Token-2022 mint with non-transferable extension for your store
2. **Register User Accounts**: When users register, create their loyalty token account automatically
3. **Integrate with Checkout**: Modify your checkout flow to automatically mint loyalty points (1:1 with SOL spent)
4. **Add Viewing Interface**: Implement a simple UI component for users to check their point balance

## Benefits of This Approach

1. **Simplicity**: 1:1 ratio of SOL to points is easy for users to understand
2. **Automatic Minting**: Points are credited without user intervention
3. **Security**: Non-transferable tokens prevent points from being traded or sold
4. **View-Only**: Users can see their points but cannot modify them, ensuring program integrity
