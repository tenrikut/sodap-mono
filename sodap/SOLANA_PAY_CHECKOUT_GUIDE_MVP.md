# Solana Pay Checkout - MVP Implementation

This minimal viable product guide focuses on the essential components for implementing Solana Pay checkout with your Sodap contract.

## 1. PDA Helper Functions

```typescript
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Program ID for your Sodap contract
const PROGRAM_ID = new PublicKey('4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv');

/**
 * Convert a string UUID to byte array for PDA seeds
 */
function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Find the Store PDA for a given owner
 */
function findStorePDA(ownerPubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('store'), ownerPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Escrow PDA for a store
 */
function findEscrowPDA(storePubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), storePubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Receipt PDA for a purchase
 */
function findReceiptPDA(storePubkey: PublicKey, buyerPubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('purchase'), storePubkey.toBuffer(), buyerPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Find the Product PDA
 */
function findProductPDA(storePubkey: PublicKey, productUuidBytes: Uint8Array): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('product'), storePubkey.toBuffer(), Buffer.from(productUuidBytes)],
    PROGRAM_ID
  );
  return pda;
}
```

## 2. Transaction Creation Function

```typescript
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';

/**
 * Create a purchase transaction using the Sodap contract
 */
async function createPurchaseTransaction(
  program: Program,
  wallet: any,
  storeOwnerPubkey: PublicKey,
  products: { uuid: string, quantity: number }[],
  totalAmountLamports: number
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  // Find store PDA
  const storePda = findStorePDA(storeOwnerPubkey);
  
  // Find escrow PDA
  const escrowPda = findEscrowPDA(storePda);
  
  // Find receipt PDA 
  const receiptPda = findReceiptPDA(storePda, wallet.publicKey);
  
  // Convert product UUIDs to byte arrays for the contract
  const productUuidBytesArrays = products.map(p => {
    const bytes = uuidToBytes(p.uuid);
    return Array.from(bytes);
  });
  
  // Convert quantities to BN array
  const quantitiesBN = products.map(p => new BN(p.quantity));
  
  // Get product PDAs for remaining accounts
  const productPDAs = products.map(p => {
    const bytes = uuidToBytes(p.uuid);
    return findProductPDA(storePda, bytes);
  });
  
  // Create a new transaction
  const tx = new Transaction();
  
  // Add the purchase cart instruction
  const purchaseIx = await program.methods
    .purchaseCart(
      productUuidBytesArrays,
      quantitiesBN,
      new BN(totalAmountLamports),
      new BN(0), // gas fee
      { success: {} } // transaction status
    )
    .accounts({
      buyer: wallet.publicKey,
      store: storePda,
      receipt: receiptPda,
      storeOwner: storeOwnerPubkey,
      escrowAccount: escrowPda,
      systemProgram: SystemProgram.programId,
      payer: wallet.publicKey,
    })
    .remainingAccounts(
      productPDAs.map(pda => ({
        pubkey: pda,
        isWritable: true, 
        isSigner: false
      }))
    )
    .instruction();
  
  tx.add(purchaseIx);
  
  return tx;
}
```

## 3. Basic Checkout Component

```typescript
import { useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Simplified checkout component
export function BasicCheckout({ 
  storeOwner, 
  cartItems, 
  onPaymentSuccess, 
  onPaymentError 
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [paymentStatus, setPaymentStatus] = useState('idle');
  
  // Calculate total in SOL
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);
  
  // Convert storeOwner to PublicKey if it's a string
  const storeOwnerPubkey = useMemo(() => {
    return typeof storeOwner === 'string' ? new PublicKey(storeOwner) : storeOwner;
  }, [storeOwner]);
  
  // Handle direct payment with connected wallet
  const handlePayment = async () => {
    if (!wallet.connected || !wallet.publicKey || cartItems.length === 0) return;
    
    setPaymentStatus('processing');
    
    try {
      // Get your Anchor program instance
      const program = getProgram(connection, wallet);
      
      // Total amount in lamports
      const totalLamports = Math.floor(totalAmount * LAMPORTS_PER_SOL);
      
      // Create the purchase transaction
      const transaction = await createPurchaseTransaction(
        program,
        wallet,
        storeOwnerPubkey,
        cartItems.map(item => ({ uuid: item.uuid, quantity: item.quantity })),
        totalLamports
      );
      
      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;
      
      // Sign and send the transaction
      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      setPaymentStatus('success');
      if (onPaymentSuccess) onPaymentSuccess(signature);
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      if (onPaymentError) onPaymentError(error);
    }
  };
  
  return (
    <div className="checkout">
      <div className="checkout-header">
        <h2>Checkout</h2>
        <WalletMultiButton />
      </div>
      
      <div className="cart-summary">
        <h3>Order Summary</h3>
        <ul>
          {cartItems.map(item => (
            <li key={item.id}>
              {item.name} x {item.quantity} = {item.price * item.quantity} SOL
            </li>
          ))}
        </ul>
        <div className="total">
          <strong>Total: {totalAmount} SOL</strong>
        </div>
      </div>
      
      {wallet.connected ? (
        <button 
          onClick={handlePayment} 
          disabled={paymentStatus === 'processing'}
        >
          {paymentStatus === 'processing' ? 'Processing...' : `Pay ${totalAmount} SOL`}
        </button>
      ) : (
        <p>Connect your wallet to checkout</p>
      )}
      
      {paymentStatus === 'success' && (
        <div className="success-message">
          <p>Payment successful! Thank you for your purchase.</p>
        </div>
      )}
      
      {paymentStatus === 'error' && (
        <div className="error-message">
          <p>Payment failed. Please try again.</p>
        </div>
      )}
    </div>
  );
}
```

## 4. Wallet Adapter Configuration

```typescript
// In your _app.tsx
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Import wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

function MyApp({ Component, pageProps }) {
  // Use Solana devnet for testing
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Initialize compatible wallets
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network]
  );
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
```

## Implementation Notes

1. Always include the correct accounts, especially `payer` which is often a source of errors
2. Ensure you're passing the correct product UUIDs and quantities in the expected format
3. Handle errors gracefully in the UI to provide feedback to users
4. Test thoroughly on devnet before deploying to production
