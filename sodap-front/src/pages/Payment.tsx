import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { useAnchor } from "@/hooks/useAnchor";
import {
  createPurchaseTransaction,
  sendTransaction,
} from "@/utils/transactionBuilder";
import { PaymentDetailsCard } from "@/components/payment/PaymentDetailsCard";
import { PaymentSuccessDialog } from "@/components/payment/PaymentSuccessDialog";
import { useCart } from "@/hooks/useCart";
import { PublicKey } from "@solana/web3.js";

// Content component that uses the profile context
const PaymentContent: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useProfile();
  const {
    walletAddress,
    connectWallet,
    isConnected,
    isLoading,
    connection,
    program,
  } = useAnchor();
  const { cartItems } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartTotal, setCartTotal] = useState("0");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);

  // Get the store ID from the URL params or session storage
  // This ensures we're making transactions for the selected store
  const [storeId, setStoreId] = useState<string>(
    // Default store ID if none is found
    "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
  );

  useEffect(() => {
    // Get cart total from session storage
    const total = sessionStorage.getItem("cartTotal");
    if (total) {
      setCartTotal(total);
    } else {
      // If no total found, redirect back to cart
      toast.error("No payment amount found. Redirecting to cart...");
      navigate("/cart");
      return;
    }

    // If cart is empty, redirect back to cart
    if (cartItems.length === 0) {
      toast.error("Your cart is empty. Redirecting to cart...");
      navigate("/cart");
      return;
    }
    
    // Get store ID from URL params or session storage
    const params = new URLSearchParams(window.location.search);
    const storeIdParam = params.get("storeId");
    const storedStoreId = sessionStorage.getItem("selectedStoreId");
    
    if (storeIdParam) {
      setStoreId(storeIdParam);
      console.log("Using store ID from URL params:", storeIdParam);
    } else if (storedStoreId) {
      setStoreId(storedStoreId);
      console.log("Using store ID from session storage:", storedStoreId);
    } else {
      console.log("No store ID found, using default ID:", storeId);
    }
  }, [navigate, walletAddress, cartItems, storeId]);

  useEffect(() => {
    // Set a timeout to check wallet connection status
    const timeoutId = setTimeout(() => {
      if (!walletAddress && !isProcessing) {
        toast.info("Please connect your wallet to proceed with payment");
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [walletAddress, isProcessing, connectWallet]);

  const handleConnectWallet = async () => {
    try {
      const success = await connectWallet();
      if (success) {
        toast.success("Wallet connected successfully!");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(
        `Connection error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handlePayment = async () => {
    try {
      if (!walletAddress) {
        // Try to connect wallet first
        toast.info("Connecting wallet...");
        const success = await connectWallet();
        if (!success) {
          toast.error("Please connect your wallet first");
          return;
        }
      }

      setIsProcessing(true);
      console.log("Starting payment process with wallet:", walletAddress);

      // Check if we're in development mode
      const isDevelopmentMode = process.env.NODE_ENV === "development";

      // Create and send a real Solana transaction
      const subtotal = parseFloat(cartTotal);

      if (!connection) {
        toast.error("Connection to Solana not established");
        setIsProcessing(false);
        return;
      }

      // In development mode, we can simulate a successful payment
      if (isDevelopmentMode) {
        console.log("Development mode: Simulating payment");

        // Wait a bit to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate a fake transaction signature
        const fakeSignature =
          "SIM" + Math.random().toString(36).substring(2, 15);
        setTransactionSignature(fakeSignature);

        // Clear the cart
        localStorage.setItem("cart", JSON.stringify([]));
        window.dispatchEvent(new Event("cartUpdated"));

        // Set points and show success dialog
        const pointsEarned = Math.round(parseFloat(cartTotal));
        setEarnedPoints(pointsEarned);

        toast.success("Payment simulation successful!");
        setShowSuccessDialog(true);
        setIsProcessing(false);
        return;
      }

      // For production mode, continue with real transaction

      // Convert the wallet address string to a PublicKey
      let walletPublicKey;
      try {
        // For real wallets, use the actual public key
        walletPublicKey = new PublicKey(walletAddress);
      } catch (error) {
        console.error("Invalid wallet address format:", error);
        toast.error(
          "Invalid wallet address format. Please reconnect your wallet."
        );
        setIsProcessing(false);
        return;
      }

      console.log("Using connection to:", connection.rpcEndpoint);
      if (program) {
        console.log("Using program ID:", program.programId.toString());
      } else {
        console.error("Program not initialized");
        toast.error("Solana program not initialized. Please try again.");
        setIsProcessing(false);
        return;
      }

      try {
        console.log(`Creating purchase transaction for store: ${storeId}`);
        console.log(`Total amount: ${subtotal} SOL`);
        console.log(`Using wallet: ${walletPublicKey.toString()}`);
        
        const transaction = await createPurchaseTransaction(
          cartItems,
          subtotal,
          storeId,
          connection,
          program,
          walletPublicKey
        );

        // Send the transaction to Devnet
        toast.info("Sending transaction to Solana Devnet...");
        const signature = await sendTransaction(transaction, connection);
        setTransactionSignature(signature);

        // Show success message with explorer link
        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        toast.success(
          <div>
            Payment successful!<br/>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
              View transaction on Solana Explorer
            </a>
          </div>,
          { duration: 10000 }
        );

        // Clear the cart after successful payment
        localStorage.setItem("cart", JSON.stringify([]));
        window.dispatchEvent(new Event("cartUpdated"));

        // Calculate loyalty points earned (1 point per 1 SOL spent)
        const pointsEarned = Math.round(parseFloat(cartTotal));
        setEarnedPoints(pointsEarned);

        // Show success dialog
        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Transaction error:", error);

        // Handle specific error types
        let errorMessage = "Payment failed";

        if (error instanceof Error) {
          if (error.message.includes("Non-base58")) {
            errorMessage =
              "Invalid wallet address format. Please reconnect your wallet.";
          } else if (error.message.includes("User rejected")) {
            errorMessage =
              "Transaction was rejected. Please try again and approve the transaction.";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage =
              "Insufficient funds in your wallet to complete this transaction. You can get free SOL from the Solana Devnet faucet.";
            
            // Add a link to the Solana Devnet faucet
            toast.error(
              <div>
                {errorMessage}<br/>
                <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
                  Get free Devnet SOL
                </a>
              </div>,
              { duration: 10000 }
            );
            return; // Early return to avoid double toast
          } else if (
            error.message.includes("Cannot read properties of undefined")
          ) {
            errorMessage =
              "Failed to initialize program properly. Please refresh the page and try again.";
          } else if (
            error.message.includes("Failed to create purchase instruction")
          ) {
            errorMessage =
              "Transaction failed: The store program doesn't support this transaction type.";
          } else if (
            error.message.includes("AccountNotFound") ||
            error.message.includes("Account does not exist")
          ) {
            errorMessage =
              "The store account does not exist on Devnet. Please make sure the store is properly initialized.";
          } else if (
            error.message.includes("custom program error")
          ) {
            errorMessage =
              "Smart contract error. This could be due to incorrect program ID or the store not being properly initialized.";
          } else {
            errorMessage = `Payment failed: ${error.message}`;
          }
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        `Payment failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    // Navigate to store selection page instead of cart
    navigate("/store-selection");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Complete Your Payment
      </h1>

      <PaymentDetailsCard
        cartTotal={cartTotal}
        walletAddress={walletAddress}
        isConnecting={isLoading}
        isProcessing={isProcessing}
        onConnectWallet={handleConnectWallet}
        onPayment={handlePayment}
      />

      <div className="mt-4 text-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          disabled={isProcessing}
        >
          Back to Cart
        </Button>
      </div>

      <PaymentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        earnedPoints={earnedPoints}
        currentPoints={userProfile.loyaltyPoints}
        onContinue={handleCloseSuccessDialog}
        transactionSignature={transactionSignature}
      />
      
      {/* Debug info - only visible in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 border border-gray-300 rounded-md p-4 bg-gray-50 text-xs">
          <h3 className="font-semibold mb-2">Devnet Transaction Details:</h3>
          <div className="space-y-1">
            <p><strong>Store ID:</strong> {storeId}</p>
            <p><strong>Wallet:</strong> {walletAddress || 'Not connected'}</p>
            <p><strong>Amount:</strong> {cartTotal} SOL</p>
            {transactionSignature && (
              <p>
                <strong>Signature:</strong> {transactionSignature.substring(0, 8)}...{transactionSignature.substring(transactionSignature.length - 8)}
                <a 
                  href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 underline text-blue-500"
                >
                  View on Explorer
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides the Profile context
const Payment: React.FC = () => {
  return (
    <Layout role="end_user">
      <ProfileProvider>
        <PaymentContent />
      </ProfileProvider>
    </Layout>
  );
};

export default Payment;
