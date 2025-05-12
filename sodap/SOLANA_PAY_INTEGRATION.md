# Solana Pay Integration Guide

This guide explains how to integrate Solana Pay with the Sodap contract to enable payments and loyalty features.

## 1. Solana Pay Checkout Flow

### QR Code Component

```jsx
import { useEffect, useMemo, useRef } from 'react';
import { encodeURL, createQR } from '@solana/pay';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export function SolanaPayQRCode({ 
  storePublicKey, 
  amount, 
  reference, 
  label, 
  message 
}) {
  const qrRef = useRef(null);
  const wallet = useWallet();
  
  // Generate the payment URL
  const url = useMemo(() => {
    if (!storePublicKey) return;
    
    const recipient = new PublicKey(storePublicKey);
    const memo = `Payment for ${label || 'products'}`;
    
    // Create payment URL with all necessary parameters
    // This URL will be encoded in the QR code
    return encodeURL({
      recipient,
      amount,
      reference,
      label,
      message: message || memo,
    });
  }, [storePublicKey, amount, reference, label, message]);
  
  // Generate the QR code when the URL changes
  useEffect(() => {
    if (!url || !qrRef.current) return;
    
    // Create the QR code
    const qr = createQR(url, 256, 'white', 'black');
    
    // Clear existing QR code
    if (qrRef.current.firstChild) {
      qrRef.current.removeChild(qrRef.current.firstChild);
    }
    
    // Append new QR code
    qrRef.current.appendChild(qr);
  }, [url]);
  
  // Return the QR code container and optional direct payment link
  return (
    <div className="solana-pay-container">
      <div className="qr-container" ref={qrRef} />
      
      {wallet?.connected && url && (
        <a
          href={url}
          className="pay-direct-button"
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

### Checkout Page Implementation

```jsx
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair 
} from '@solana/web3.js';
import { 
  findEscrowPDA, 
  findReceiptPDA, 
  getProductPDA 
} from '../utils/pda';
import { SolanaPayQRCode } from '../components/SolanaPayQRCode';
import { purchaseCart } from '../utils/program-interactions';

export default function CheckoutPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  
  // Mock checkout data (would come from your cart)
  const [checkoutData, setCheckoutData] = useState({
    storePublicKey: 'YourStorePDAHere',
    amount: 0.5, // SOL
    products: [
      { 
        uuid: 'product-uuid-1', 
        quantity: 1, 
        price: 0.3 
      },
      { 
        uuid: 'product-uuid-2', 
        quantity: 2, 
        price: 0.1 
      }
    ]
  });
  
  // Calculate total amount
  const totalAmount = useMemo(() => {
    return checkoutData.products.reduce(
      (sum, product) => sum + (product.price * product.quantity), 
      0
    );
  }, [checkoutData.products]);
  
  // Generate a unique reference for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);
  
  // Process direct checkout with connected wallet
  const handleDirectCheckout = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get product UUIDs and quantities
      const productUuids = checkoutData.products.map(p => p.uuid);
      const quantities = checkoutData.products.map(p => p.quantity);
      
      // Calculate total in lamports
      const totalLamports = totalAmount * 1_000_000_000;
      
      // Make the purchase call to your contract
      const txSignature = await purchaseCart(
        connection, 
        wallet, 
        checkoutData.storePublicKey, 
        productUuids, 
        quantities, 
        totalLamports
      );
      
      console.log('Transaction successful:', txSignature);
      setPaymentStatus('success');
      
      // Here you could redirect to a success page
      // or show a success message
      
    } catch (error) {
      console.error('Checkout failed:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Monitor payment for QR code flow
  useEffect(() => {
    if (!reference || !connection) return;
    
    // Function to check if the transaction was confirmed
    const checkTransaction = async () => {
      try {
        // Get all signatures for reference
        const signatureInfo = await connection.getSignaturesForAddress(reference);
        
        if (signatureInfo.length > 0) {
          // Transaction found, verify it was successful
          const txSignature = signatureInfo[0].signature;
          const txStatus = await connection.getTransaction(txSignature);
          
          if (txStatus?.meta?.err) {
            // Transaction failed
            setPaymentStatus('failed');
          } else {
            // Transaction succeeded
            setPaymentStatus('success');
            
            // Here you would call your backend to process the order
            // or update the blockchain state
          }
          
          // Stop polling once we have a result
          return true;
        }
        
        // Transaction not found yet, continue polling
        return false;
      } catch (error) {
        console.error('Error checking transaction:', error);
        return false;
      }
    };
    
    // Set up polling
    const intervalId = setInterval(async () => {
      const found = await checkTransaction();
      if (found) {
        clearInterval(intervalId);
      }
    }, 1000); // Check every second
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, [reference, connection]);
  
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      {paymentStatus === 'pending' && (
        <>
          <div className="payment-options">
            <h2>Payment Options</h2>
            
            {/* QR Code for mobile wallet payment */}
            <div className="qr-payment-option">
              <h3>Pay with Mobile Wallet</h3>
              <SolanaPayQRCode
                storePublicKey={checkoutData.storePublicKey}
                amount={totalAmount}
                reference={reference}
                label="Sodap Store Purchase"
                message={`Payment for ${checkoutData.products.length} products`}
              />
            </div>
            
            {/* Direct payment button for connected wallets */}
            {wallet.connected && (
              <div className="direct-payment-option">
                <h3>Pay with Connected Wallet</h3>
                <button 
                  onClick={handleDirectCheckout}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Pay ${totalAmount} SOL`}
                </button>
              </div>
            )}
          </div>
          
          <div className="order-summary">
            <h2>Order Summary</h2>
            <ul>
              {checkoutData.products.map((product, index) => (
                <li key={index}>
                  {product.uuid.substring(0, 8)}... - 
                  {product.quantity} x {product.price} SOL
                </li>
              ))}
            </ul>
            <div className="total">
              <strong>Total: {totalAmount} SOL</strong>
            </div>
          </div>
        </>
      )}
      
      {paymentStatus === 'success' && (
        <div className="success-message">
          <h2>Payment Successful!</h2>
          <p>Thank you for your purchase.</p>
          {/* You could add order details here */}
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="error-message">
          <h2>Payment Failed</h2>
          <p>Sorry, there was an issue processing your payment. Please try again.</p>
          <button onClick={() => setPaymentStatus('pending')}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
```

### Program Interactions Helper

```jsx
// utils/program-interactions.js
import { 
  PublicKey, 
  Transaction, 
  SystemProgram 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { findProgramAddressSync } from '@coral-xyz/anchor/dist/cjs/utils/pubkey';
import { Buffer } from 'buffer';

// Get your program ID from your Anchor.toml or whereever it's defined
const PROGRAM_ID = new PublicKey('YourProgramIDHere');

// Helper function to convert string UUID to bytes
export function uuidToBytes(uuid) {
  // Remove hyphens and convert to buffer
  const hex = uuid.replace(/-/g, '');
  const bytes = Buffer.from(hex, 'hex');
  return bytes;
}

// Find Store PDA
export function findStorePDA(ownerPubkey) {
  return findProgramAddressSync(
    [Buffer.from('store'), ownerPubkey.toBuffer()],
    PROGRAM_ID
  )[0];
}

// Find Escrow PDA
export function findEscrowPDA(storePubkey) {
  return findProgramAddressSync(
    [Buffer.from('escrow'), storePubkey.toBuffer()],
    PROGRAM_ID
  )[0];
}

// Find Receipt PDA
export function findReceiptPDA(storePubkey, buyerPubkey) {
  return findProgramAddressSync(
    [Buffer.from('purchase'), storePubkey.toBuffer(), buyerPubkey.toBuffer()],
    PROGRAM_ID
  )[0];
}

// Find Product PDA
export function findProductPDA(storePubkey, productUuid) {
  const productUuidBytes = uuidToBytes(productUuid);
  
  return findProgramAddressSync(
    [Buffer.from('product'), storePubkey.toBuffer(), productUuidBytes],
    PROGRAM_ID
  )[0];
}

// Execute purchase cart transaction
export async function purchaseCart(
  connection,
  wallet,
  storePublicKey,
  productUuids,
  quantities,
  totalAmount,
  gasFee = 0
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  const storePubkey = new PublicKey(storePublicKey);
  const escrowPDA = findEscrowPDA(storePubkey);
  const receiptPDA = findReceiptPDA(storePubkey, wallet.publicKey);
  
  // Convert product UUIDs to bytes
  const productUuidBytesArray = productUuids.map(uuid => 
    Array.from(uuidToBytes(uuid))
  );
  
  // Get product PDAs for remaining accounts
  const productPDAs = productUuids.map(uuid => 
    findProductPDA(storePubkey, uuid)
  );
  
  // Get program
  const program = await getProgram(connection, wallet);
  
  // Create the transaction
  const tx = await program.methods
    .purchaseCart(
      productUuidBytesArray,
      quantities.map(q => new BN(q)),
      new BN(totalAmount),
      new BN(gasFee),
      { success: {} } // Transaction status
    )
    .accounts({
      buyer: wallet.publicKey,
      store: storePubkey,
      receipt: receiptPDA,
      storeOwner: storePubkey, // This may be different in your setup
      escrowAccount: escrowPDA,
      systemProgram: SystemProgram.programId,
      payer: wallet.publicKey,
    })
    .remainingAccounts(
      // Add product accounts as remaining accounts
      productPDAs.map(pda => ({
        pubkey: pda,
        isWritable: true,
        isSigner: false
      }))
    )
    .transaction();
  
  // Sign and send the transaction
  return await wallet.sendTransaction(tx, connection);
}

// Mint loyalty points after a purchase
export async function mintLoyaltyPoints(
  connection,
  wallet,
  storePublicKey,
  purchaseAmount,
  destinationTokenAccount
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  const storePubkey = new PublicKey(storePublicKey);
  
  // Find the loyalty mint PDA
  const [loyaltyMintPDA] = findProgramAddressSync(
    [Buffer.from('loyalty_mint'), storePubkey.toBuffer()],
    PROGRAM_ID
  );
  
  // Get program
  const program = await getProgram(connection, wallet);
  
  // Create the transaction
  const tx = await program.methods
    .mintLoyaltyPoints(new BN(purchaseAmount), wallet.publicKey)
    .accounts({
      store: storePubkey,
      loyaltyMint: loyaltyMintPDA,
      authority: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      destination: destinationTokenAccount,
      payer: wallet.publicKey,
    })
    .transaction();
  
  // Sign and send the transaction
  return await wallet.sendTransaction(tx, connection);
}

// Redeem loyalty points
export async function redeemLoyaltyPoints(
  connection,
  wallet,
  storePublicKey,
  pointsToRedeem,
  sourceTokenAccount
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  const storePubkey = new PublicKey(storePublicKey);
  
  // Find the loyalty mint PDA
  const [loyaltyMintPDA] = findProgramAddressSync(
    [Buffer.from('loyalty_mint'), storePubkey.toBuffer()],
    PROGRAM_ID
  );
  
  // Get program
  const program = await getProgram(connection, wallet);
  
  // Create the transaction
  const tx = await program.methods
    .redeemLoyaltyPoints(new BN(pointsToRedeem))
    .accounts({
      store: storePubkey,
      loyaltyMint: loyaltyMintPDA,
      authority: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      source: sourceTokenAccount,
      payer: wallet.publicKey,
    })
    .transaction();
  
  // Sign and send the transaction
  return await wallet.sendTransaction(tx, connection);
}

// Helper to get program instance
async function getProgram(connection, wallet) {
  // This is a simplified version - in a real app you would use
  // anchor.Program.at(PROGRAM_ID) with your IDL
  // Implement based on your specific setup
}
```

## 2. Upgrading to Token-2022

To upgrade your loyalty program to use Token-2022, you need to:

1. Update imports to use token_2022 from @solana/spl-token
2. Use TOKEN_2022_PROGRAM_ID instead of TOKEN_PROGRAM_ID
3. Implement transfer hooks if needed

### Example Client Usage with Token-2022

```javascript
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddress 
} from '@solana/spl-token';

// Create a token account for loyalty tokens using Token-2022
export async function createLoyaltyTokenAccount(
  connection,
  wallet,
  storePublicKey
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  const storePubkey = new PublicKey(storePublicKey);
  
  // Find the loyalty mint PDA
  const [loyaltyMintPDA] = findProgramAddressSync(
    [Buffer.from('loyalty_mint'), storePubkey.toBuffer()],
    PROGRAM_ID
  );
  
  // Get associated token address using Token-2022
  const tokenAccount = await getAssociatedTokenAddress(
    loyaltyMintPDA,
    wallet.publicKey,
    false, // allowOwnerOffCurve
    TOKEN_2022_PROGRAM_ID
  );
  
  // Create the associated token account if it doesn't exist
  const accountInfo = await connection.getAccountInfo(tokenAccount);
  
  if (!accountInfo) {
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        tokenAccount, // associated token account address
        wallet.publicKey, // owner
        loyaltyMintPDA, // mint
        TOKEN_2022_PROGRAM_ID
      )
    );
    
    await wallet.sendTransaction(transaction, connection);
  }
  
  return tokenAccount;
}
```

## 3. Integrating with Your Existing Contract

1. **Identify PDAs**: Map out all PDAs used in your contract
2. **Create Utility Functions**: Implement helper functions to interact with your contract
3. **Build UI Components**: Create checkout, wallet connection, and loyalty display components

### Key Considerations

1. Always include the `payer` account when required by your contract
2. When working with Token-2022, account for extra fees due to additional rent
3. Implement proper error handling for failed transactions
4. Consider the UX implications of transaction confirmation times

## 4. Testing Your Integration

1. Start with a simple flow (e.g., create store, register product)
2. Test Solana Pay checkout with smaller amounts
3. Verify that loyalty points are correctly minted after purchase
4. Test the redemption flow to ensure points can be redeemed

Remember that testing on devnet or testnet is crucial before going to mainnet.
