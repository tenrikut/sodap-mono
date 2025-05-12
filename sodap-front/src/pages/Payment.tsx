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

  // Store ID - In a real app, this would come from the store selection or context
  // For this implementation, we're using a placeholder that would be replaced with a real store ID
  const STORE_ID = "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"; // Replace with actual store ID

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
  }, [navigate, walletAddress, cartItems]);

  useEffect(() => {
    // Check if we're in development mode
    const isDevelopmentMode = process.env.NODE_ENV === "development";

    // Set a timeout to check wallet connection status
    const timeoutId = setTimeout(() => {
      if (!walletAddress && !isProcessing) {
        if (isDevelopmentMode) {
          console.log("Development mode: Auto-connecting demo wallet");
          connectWallet().then((success) => {
            if (success) {
              console.log("Demo wallet connected automatically");
            } else {
              toast.error(
                "Failed to connect demo wallet. Will retry once more."
              );
              // Retry once after a short delay
              setTimeout(() => {
                connectWallet().then((retrySuccess) => {
                  if (!retrySuccess) {
                    toast.error(
                      "Failed to connect wallet after retry. Please connect manually."
                    );
                  }
                });
              }, 1500);
            }
          });
        } else {
          toast.info("Please connect your wallet to proceed with payment");
        }
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
        const transaction = await createPurchaseTransaction(
          cartItems,
          subtotal,
          STORE_ID,
          connection,
          program,
          walletPublicKey
        );

        // Send the transaction
        toast.info("Sending transaction to Solana network...");
        const signature = await sendTransaction(transaction, connection);
        setTransactionSignature(signature);

        toast.success(
          "Payment successful! Transaction signature: " + signature
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
              "Insufficient funds in your wallet to complete this transaction.";
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
