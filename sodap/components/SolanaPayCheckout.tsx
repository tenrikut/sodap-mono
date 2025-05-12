import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { SolanaPayQRCode } from './SolanaPayQRCode';
import { purchaseCart } from '../utils/program-interface';
import { findStorePDA, solToLamports } from '../utils/pda-helpers';

// Define cart item interface
interface CartItem {
  id: string;
  uuid: string; // Product UUID in the contract
  name: string;
  price: number; // Price in SOL
  quantity: number;
}

interface SolanaPayCheckoutProps {
  storeOwner: string | PublicKey; // Store owner public key
  cartItems: CartItem[]; // Items in the cart
  onPaymentSuccess?: (signature: string) => void; // Callback for successful payment
  onPaymentError?: (error: Error) => void; // Callback for payment error
}

export function SolanaPayCheckout({ 
  storeOwner, 
  cartItems, 
  onPaymentSuccess,
  onPaymentError 
}: SolanaPayCheckoutProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // Payment states
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentSignature, setPaymentSignature] = useState<string | null>(null);
  
  // Generate a unique reference key for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);
  
  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);
  
  // Calculate store PDA
  const storePubkey = useMemo(() => {
    const ownerPubkey = typeof storeOwner === 'string' 
      ? new PublicKey(storeOwner) 
      : storeOwner;
    return findStorePDA(ownerPubkey);
  }, [storeOwner]);
  
  // Handle direct payment with connected wallet
  const handleDirectPayment = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || cartItems.length === 0) return;
    
    try {
      setPaymentStatus('processing');
      
      // Extract product UUIDs and quantities
      const productUuids = cartItems.map(item => item.uuid);
      const quantities = cartItems.map(item => item.quantity);
      
      // Calculate total in lamports
      const totalLamports = solToLamports(cartTotal);
      
      // Execute purchase
      const signature = await purchaseCart(
        connection,
        wallet,
        storePubkey,
        productUuids,
        quantities,
        totalLamports,
        reference
      );
      
      setPaymentSignature(signature);
      setPaymentStatus('success');
      
      // Call success callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess(signature);
      }
      
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      
      // Call error callback if provided
      if (onPaymentError && error instanceof Error) {
        onPaymentError(error);
      }
    }
  };
  
  // Monitor payment status for QR code flow
  useEffect(() => {
    if (paymentStatus !== 'idle' || !reference) return;
    
    const interval = setInterval(async () => {
      try {
        // Check for transactions referencing our reference key
        const signatureInfo = await connection.getSignaturesForAddress(reference);
        
        if (signatureInfo.length > 0) {
          // Found a transaction, check if it's confirmed
          clearInterval(interval);
          
          const signature = signatureInfo[0].signature;
          const status = await connection.getTransaction(signature);
          
          if (status && !status.meta?.err) {
            // Transaction successful
            setPaymentSignature(signature);
            setPaymentStatus('success');
            
            if (onPaymentSuccess) {
              onPaymentSuccess(signature);
            }
          } else {
            // Transaction failed
            setPaymentStatus('error');
            
            if (onPaymentError) {
              onPaymentError(new Error('Transaction failed'));
            }
          }
        }
      } catch (error) {
        console.error('Error checking transaction:', error);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [reference, connection, paymentStatus, onPaymentSuccess, onPaymentError]);
  
  return (
    <div className="solana-pay-checkout">
      <h2>Checkout</h2>
      
      {paymentStatus === 'idle' && (
        <>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <ul>
              {cartItems.map((item) => (
                <li key={item.id}>
                  {item.name} - {item.quantity} x {item.price} SOL = {item.quantity * item.price} SOL
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <strong>Total: {cartTotal} SOL</strong>
            </div>
          </div>
          
          <div className="payment-options">
            <div className="qr-code-option">
              <h3>Pay with Mobile Wallet</h3>
              <p>Scan this QR code with a Solana Pay compatible wallet</p>
              
              <SolanaPayQRCode
                recipient={storePubkey}
                amount={cartTotal}
                reference={reference}
                label="Sodap Store"
                message={`Payment for ${cartItems.length} items`}
              />
            </div>
            
            {wallet.connected && (
              <div className="direct-payment">
                <h3>Pay with Connected Wallet</h3>
                <button 
                  onClick={handleDirectPayment}
                  className="pay-button"
                  disabled={cartItems.length === 0}
                >
                  Pay {cartTotal} SOL
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {paymentStatus === 'processing' && (
        <div className="payment-processing">
          <h3>Processing Payment</h3>
          <p>Please wait while your transaction is being processed...</p>
          {/* Add a spinner here if desired */}
        </div>
      )}
      
      {paymentStatus === 'success' && (
        <div className="payment-success">
          <h3>Payment Successful!</h3>
          <p>Your payment has been processed successfully.</p>
          {paymentSignature && (
            <p className="transaction-signature">
              Transaction: <a 
                href={`https://explorer.solana.com/tx/${paymentSignature}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {paymentSignature.slice(0, 8)}...{paymentSignature.slice(-8)}
              </a>
            </p>
          )}
        </div>
      )}
      
      {paymentStatus === 'error' && (
        <div className="payment-error">
          <h3>Payment Failed</h3>
          <p>There was an error processing your payment. Please try again.</p>
          <button 
            onClick={() => setPaymentStatus('idle')}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
