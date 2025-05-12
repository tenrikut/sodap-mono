import React, { useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { purchaseCart, mintLoyaltyPoints } from '../utils/program-interface';
import { solToLamports } from '../utils/pda-helpers';

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

// Component props
interface CheckoutProps {
  storeOwner: string | PublicKey;
  cartItems: CartItem[];
  onPaymentSuccess?: (signature: string) => void;
  onPaymentError?: (error: Error) => void;
}

/**
 * Simplified Checkout Component for Solana Pay
 * Handles purchase and automatic loyalty point minting (1:1 ratio)
 */
export function CheckoutComponent({ 
  storeOwner, 
  cartItems, 
  onPaymentSuccess, 
  onPaymentError 
}: CheckoutProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [loyaltyPointsEarned, setLoyaltyPointsEarned] = useState<number>(0);
  
  // Calculate total amount in SOL
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);
  
  // Process payment
  const handlePayment = async () => {
    if (!wallet.connected || !wallet.publicKey || cartItems.length === 0) {
      return;
    }
    
    setPaymentStatus('processing');
    
    try {
      // Convert store owner to PublicKey if it's a string
      const storeOwnerPubkey = typeof storeOwner === 'string' 
        ? new PublicKey(storeOwner) 
        : storeOwner;
      
      // 1. Execute purchase transaction
      const purchaseSignature = await purchaseCart(
        connection,
        wallet,
        storeOwnerPubkey,
        cartItems.map(item => item.uuid),
        cartItems.map(item => item.quantity),
        solToLamports(totalAmount)
      );
      
      // 2. Mint loyalty points (1:1 ratio)
      // Only mint if totalAmount is at least 1 SOL
      if (totalAmount >= 1) {
        const loyaltyResult = await mintLoyaltyPoints(
          connection,
          wallet,
          storeOwnerPubkey,
          wallet.publicKey,
          totalAmount
        );
        
        if (loyaltyResult) {
          setLoyaltyPointsEarned(loyaltyResult.pointsMinted);
        }
      }
      
      setTransactionSignature(purchaseSignature);
      setPaymentStatus('success');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(purchaseSignature);
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
    <div className="checkout-container">
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
            <ul className="cart-items">
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  {item.image && (
                    <div className="item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                  )}
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <div className="item-price-qty">
                      <span>{item.price} SOL × {item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(4)} SOL</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>Total:</span>
              <strong>{totalAmount.toFixed(4)} SOL</strong>
            </div>
            
            <div className="loyalty-info">
              <p>
                <i>You'll earn {Math.floor(totalAmount)} loyalty points with this purchase</i>
              </p>
            </div>
          </div>
          
          <div className="checkout-actions">
            {wallet.connected ? (
              <button 
                className={`checkout-button ${paymentStatus === 'processing' ? 'processing' : ''}`}
                onClick={handlePayment}
                disabled={paymentStatus === 'processing'}
              >
                {paymentStatus === 'processing' ? 'Processing Payment...' : `Pay ${totalAmount.toFixed(4)} SOL`}
              </button>
            ) : (
              <p className="connect-prompt">Connect your wallet to complete checkout</p>
            )}
          </div>
          
          {paymentStatus === 'success' && (
            <div className="payment-success">
              <h3>Payment Successful!</h3>
              <p>Thank you for your purchase.</p>
              
              {loyaltyPointsEarned > 0 && (
                <div className="loyalty-earned">
                  <p>You earned {loyaltyPointsEarned} loyalty points!</p>
                </div>
              )}
              
              {transactionSignature && (
                <p className="transaction-link">
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
              <p>There was an error processing your payment. Please try again.</p>
              <button 
                className="retry-button"
                onClick={() => setPaymentStatus('idle')}
              >
                Try Again
              </button>
            </div>
          )}
        </>
      )}
      
      <style jsx>{`
        .checkout-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .checkout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .cart-summary {
          background: #f7f7f7;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .cart-items {
          list-style: none;
          padding: 0;
        }
        .cart-item {
          display: flex;
          border-bottom: 1px solid #eee;
          padding: 10px 0;
        }
        .item-image {
          width: 60px;
          height: 60px;
          margin-right: 15px;
        }
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
        }
        .item-details {
          flex: 1;
        }
        .item-details h4 {
          margin: 0 0 8px 0;
        }
        .item-price-qty {
          display: flex;
          justify-content: space-between;
        }
        .cart-total {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #ddd;
        }
        .loyalty-info {
          font-size: 14px;
          color: #666;
          text-align: right;
          margin-top: 8px;
        }
        .checkout-button {
          background: #512da8;
          color: white;
          border: none;
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .checkout-button:hover {
          background: #3f1f8c;
        }
        .checkout-button.processing {
          background: #9c9c9c;
          cursor: not-allowed;
        }
        .payment-success,
        .payment-error {
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .payment-success {
          background: #e8f5e9;
          border: 1px solid #a5d6a7;
        }
        .payment-error {
          background: #ffebee;
          border: 1px solid #ffcdd2;
        }
        .transaction-link a {
          color: #512da8;
          text-decoration: none;
        }
        .loyalty-earned {
          background: #fff8e1;
          border: 1px solid #ffecb3;
          border-radius: 4px;
          padding: 10px;
          margin: 10px 0;
          font-weight: 500;
        }
        .retry-button {
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 16px;
          font-size: 14px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
        .connect-prompt {
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
}
