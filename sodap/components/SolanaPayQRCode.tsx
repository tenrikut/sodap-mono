import React, { useEffect, useMemo, useRef } from 'react';
import { encodeURL, createQR } from '@solana/pay';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

// Define props interface
interface SolanaPayQRCodeProps {
  recipient: string | PublicKey;  // Store public key to receive payment
  amount: number;                // Amount in SOL 
  reference?: PublicKey;         // Optional reference for tracking the transaction
  label?: string;                // Optional label for the payment
  message?: string;              // Optional message for the payment
  memo?: string;                 // Optional memo to include in the transaction
  size?: number;                 // QR code size in pixels
}

export function SolanaPayQRCode({ 
  recipient, 
  amount, 
  reference, 
  label = 'Sodap Store', 
  message = 'Payment for products', 
  memo,
  size = 256
}: SolanaPayQRCodeProps) {
  // QR code container reference
  const qrRef = useRef<HTMLDivElement>(null);
  const wallet = useWallet();
  
  // Generate the Solana Pay URL
  const url = useMemo(() => {
    if (!recipient) return undefined;
    
    // Convert recipient to PublicKey if it's a string
    const recipientPublicKey = typeof recipient === 'string' 
      ? new PublicKey(recipient) 
      : recipient;
    
    // Create payment URL
    return encodeURL({
      recipient: recipientPublicKey,
      amount: amount ? new Number(amount) : undefined,
      reference,
      label,
      message,
      memo
    });
  }, [recipient, amount, reference, label, message, memo]);
  
  // Generate QR code when URL changes
  useEffect(() => {
    if (!url || !qrRef.current) return;
    
    // Remove any existing QR code
    if (qrRef.current.firstChild) {
      qrRef.current.removeChild(qrRef.current.firstChild);
    }
    
    // Create new QR code with specified size
    const qr = createQR(url, size, 'white', 'black');
    qrRef.current.appendChild(qr);
    
    // Return cleanup function
    return () => {
      if (qrRef.current?.firstChild) {
        qrRef.current.removeChild(qrRef.current.firstChild);
      }
    };
  }, [url, size]);
  
  // Open URL directly if wallet is connected (for testing/desktop)
  const handlePayWithWallet = () => {
    if (url) {
      window.open(url.toString(), '_blank');
    }
  };
  
  return (
    <div className="solana-pay-container">
      <div className="qr-code" ref={qrRef} />
      
      {wallet.connected && url && (
        <button 
          onClick={handlePayWithWallet}
          className="pay-direct-button"
        >
          Pay with Connected Wallet
        </button>
      )}
    </div>
  );
}
