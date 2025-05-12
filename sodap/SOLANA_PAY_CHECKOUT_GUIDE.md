# Solana Pay Checkout Implementation Guide

This guide provides step-by-step instructions to implement Solana Pay checkout with your existing Sodap contract.

## Step 1: Create Helper Functions for PDAs

First, set up utility functions to find all the PDAs needed for Solana Pay checkout:

```typescript
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
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

## Step 2: Implement Solana Pay QR Code Generator

Create a component to generate and display Solana Pay QR codes:

```typescript
import { createQR, encodeURL } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useRef } from 'react';

interface SolanaPayQRProps {
  recipient: string | PublicKey;  // The store's public key to receive payment
  amount: number;                // Amount in SOL
  reference?: PublicKey;         // Optional reference for tracking the transaction
  label?: string;                // Optional label for the payment
  message?: string;              // Optional message for the payment
  size?: number;                 // QR code size in pixels
}

export function SolanaPayQR({
  recipient, 
  amount, 
  reference, 
  label = 'Sodap Store', 
  message = 'Payment for products',
  size = 256
}: SolanaPayQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Generate Solana Pay URL
  const url = useMemo(() => {
    if (!recipient) return;
    
    const recipientPubkey = typeof recipient === 'string' 
      ? new PublicKey(recipient) 
      : recipient;
    
    return encodeURL({
      recipient: recipientPubkey,
      amount: amount ? new Number(amount) : undefined,
      reference,
      label,
      message,
    });
  }, [recipient, amount, reference, label, message]);
  
  // Generate QR code when URL changes
  useEffect(() => {
    if (!url || !qrRef.current) return;
    
    // Clear previous QR code
    if (qrRef.current.firstChild) {
      qrRef.current.removeChild(qrRef.current.firstChild);
    }
    
    // Create and append new QR code
    const qr = createQR(url, size, 'white', 'black');
    qrRef.current.appendChild(qr);
    
    return () => {
      if (qrRef.current?.firstChild) {
        qrRef.current.removeChild(qrRef.current.firstChild);
      }
    };
  }, [url, size]);
  
  return (
    <div className="solana-pay-qr">
      <div className="qr-container" ref={qrRef} />
      {url && (
        <a 
          href={url.toString()} 
          className="pay-link" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Pay with Wallet
        </a>
      )}
    </div>
  );
}
```

## Step 3: Create Checkout Transaction Function

Implement a function to create and submit the purchase transaction:

```typescript
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, BN, Idl } from '@coral-xyz/anchor';

/**
 * Process a Solana Pay checkout transaction using your existing contract
 */
async function processPurchaseTransaction(
  program: Program,
  connection: Connection,
  wallet: any,
  storeOwnerPubkey: PublicKey,
  products: { uuid: string, quantity: number }[],
  totalAmountLamports: number,
  reference?: PublicKey
) {
  if (!wallet.publicKey || !wallet.signTransaction) {
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
  
  // Add reference instruction if provided (for QR code tracking)
  if (reference) {
    tx.add({
      keys: [{ pubkey: reference, isSigner: false, isWritable: false }],
      programId: SystemProgram.programId,
      data: Buffer.from([]),
    });
  }
  
  // Add the purchase cart instruction
  const purchaseIx = await program.methods
    .purchaseCart(
      productUuidBytesArrays,
      quantitiesBN,
      new BN(totalAmountLamports),
      new BN(0), // gas fee (can be customized if needed)
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
  
  // Get recent blockhash and sign transaction
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  
  const signedTx = await wallet.signTransaction(tx);
  
  // Send the signed transaction
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}
```

## Step 4: Implement Transaction Monitoring

Create a function to monitor transactions using the reference key:

```typescript
/**
 * Monitor a transaction by its reference public key
 */
async function monitorTransactionByReference(
  connection: Connection,
  reference: PublicKey,
  callback: (status: 'success' | 'failed' | 'pending', signature?: string) => void,
  timeout = 60000 // 1 minute timeout
) {
  let intervalId: NodeJS.Timeout;
  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);
    callback('pending'); // Still pending after timeout
  }, timeout);
  
  intervalId = setInterval(async () => {
    try {
      // Check for signatures that include our reference
      const signatures = await connection.getSignaturesForAddress(reference);
      
      if (signatures.length > 0) {
        // We found a transaction with our reference
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        
        // Get transaction details
        const signature = signatures[0].signature;
        const tx = await connection.getTransaction(signature);
        
        if (tx && !tx.meta?.err) {
          callback('success', signature);
        } else {
          callback('failed', signature);
        }
      }
    } catch (error) {
      console.error('Error checking transaction:', error);
    }
  }, 1000); // Check every second
  
  // Return function to cancel monitoring
  return () => {
    clearInterval(intervalId);
    clearTimeout(timeoutId);
  };
}
```

## Step 5: Complete Checkout Component Implementation

Put it all together in a complete checkout component:

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { SolanaPayQR } from './SolanaPayQR';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Define product interface
interface Product {
  id: string;
  uuid: string;
  name: string;
  price: number; // in SOL
  image?: string;
}

// Define cart item interface
interface CartItem extends Product {
  quantity: number;
}

// Example component props
interface CheckoutProps {
  storeOwner: string | PublicKey;
  cartItems: CartItem[];
  onPaymentSuccess?: (signature: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function SolanaPayCheckout({ 
  storeOwner, 
  cartItems, 
  onPaymentSuccess, 
  onPaymentError 
}: CheckoutProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // Payment states
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  
  // Calculate total in SOL
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);
  
  // Generate a unique reference for this payment
  const reference = useMemo(() => Keypair.generate().publicKey, []);
  
  // Convert storeOwner to PublicKey if it's a string
  const storeOwnerPubkey = useMemo(() => {
    return typeof storeOwner === 'string' ? new PublicKey(storeOwner) : storeOwner;
  }, [storeOwner]);
  
  // Monitor for transaction completion when using QR code
  useEffect(() => {
    if (!reference || paymentStatus !== 'idle') return;
    
    const cancelMonitoring = monitorTransactionByReference(
      connection,
      reference,
      (status, signature) => {
        if (status === 'success' && signature) {
          setTransactionSignature(signature);
          setPaymentStatus('success');
          if (onPaymentSuccess) onPaymentSuccess(signature);
        } else if (status === 'failed') {
          setPaymentStatus('error');
          if (onPaymentError) onPaymentError(new Error('Payment failed'));
        }
      },
      120000 // 2 minute timeout
    );
    
    return cancelMonitoring;
  }, [reference, connection, paymentStatus, onPaymentSuccess, onPaymentError]);
  
  // Handle direct payment with connected wallet
  const handleDirectPayment = async () => {
    if (!wallet.connected || !wallet.publicKey || cartItems.length === 0) return;
    
    setPaymentStatus('processing');
    
    try {
      // Get your Anchor program instance - implement this based on your setup
      const program = getProgram(connection, wallet);
      
      // Total amount in lamports
      const totalLamports = Math.floor(totalAmount * LAMPORTS_PER_SOL);
      
      // Process the purchase
      const signature = await processPurchaseTransaction(
        program,
        connection,
        wallet,
        storeOwnerPubkey,
        cartItems.map(item => ({ uuid: item.uuid, quantity: item.quantity })),
        totalLamports,
        reference
      );
      
      setTransactionSignature(signature);
      setPaymentStatus('success');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(signature);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      
      if (onPaymentError && error instanceof Error) {
        onPaymentError(error);
      }
    }
  };
  
  return (
    <div className="solana-pay-checkout">
      <div className="checkout-header">
        <h2>Checkout</h2>
        <WalletMultiButton />
      </div>
      
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
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
          
          {paymentStatus === 'idle' && (
            <div className="payment-options">
              <div className="qr-option">
                <h3>Pay with Mobile Wallet</h3>
                <p>Scan this QR code with a Solana Pay compatible wallet</p>
                <SolanaPayQR
                  recipient={storeOwnerPubkey}
                  amount={totalAmount}
                  reference={reference}
                  label="Sodap Store"
                  message={`Payment for ${cartItems.length} items`}
                />
              </div>
              
              {wallet.connected && (
                <div className="direct-payment">
                  <h3>Pay with Connected Wallet</h3>
                  <button onClick={handleDirectPayment} className="pay-button">
                    Pay {totalAmount} SOL
                  </button>
                </div>
              )}
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="payment-processing">
              <h3>Processing Payment</h3>
              <p>Please wait while your payment is being processed...</p>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="payment-success">
              <h3>Payment Successful!</h3>
              <p>Thank you for your purchase.</p>
              {transactionSignature && (
                <p>
                  <a 
                    href={`https://explorer.solana.com/tx/${transactionSignature}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View Transaction
                  </a>
                </p>
              )}
            </div>
          )}
          
          {paymentStatus === 'error' && (
            <div className="payment-error">
              <h3>Payment Failed</h3>
              <p>There was an error processing your payment.</p>
              <button onClick={() => setPaymentStatus('idle')} className="retry-button">
                Try Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

## Step 6: Configure Your Application

Ensure your application is properly configured with the Solana wallet adapter:

```typescript
// In your _app.tsx or equivalent
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Import wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

function MyApp({ Component, pageProps }) {
  // Use Solana devnet for testing
  const network = WalletAdapterNetwork.Devnet;
  
  // Get connection endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Initialize compatible wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
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

## Integration Notes:

1. **Required Accounts**: Always make sure to include the correct accounts, especially `payer` which seems to be a common source of errors.

2. **Transaction Structure**: Always include the reference instruction if you want to track the transaction via QR code payment.

3. **Error Handling**: Implement robust error handling, especially for transaction failures, which can happen due to various reasons like insufficient funds or RPC node issues.

4. **Testing**: Test thoroughly on devnet before moving to mainnet. Start with small amounts to verify everything works correctly.

5. **User Experience**: Consider adding loading states, confirmations, and clear error messages to improve the checkout experience.
