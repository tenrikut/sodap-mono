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
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

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
  const { addNewPurchase } = usePurchaseHistory();
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

  // Get store wallet address from session storage
  const [storeWalletAddress, setStoreWalletAddress] = useState<string>("");
  const [storePda, setStorePda] = useState<string>("");
  
  useEffect(() => {
    // Get the current selected store ID
    const selectedStoreId = sessionStorage.getItem("selectedStoreId");
    console.log("Selected store ID:", selectedStoreId);

    // Special case for Sodap Watch Store (ID: 5)
    // ALWAYS use these hardcoded values for this store to ensure it works
    if (selectedStoreId === "5") {
      const fixedWalletAddress = "9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J";
      const fixedPdaAddress = "AjFmfk93LVedXVRXTdac2DWYbPYBYV6LeayyMzPU81qo";
      
      setStoreWalletAddress(fixedWalletAddress);
      setStorePda(fixedPdaAddress);
      
      // Save to session storage for consistency
      sessionStorage.setItem("selectedStoreWallet", fixedWalletAddress);
      sessionStorage.setItem("selectedStorePda", fixedPdaAddress);
      
      console.log("Using fixed wallet for Sodap Watch Store:", fixedWalletAddress);
      console.log("Using fixed PDA for Sodap Watch Store:", fixedPdaAddress);
      
      // Save to localStorage too for the admin dashboard
      localStorage.setItem("sodap-store-wallet-5", JSON.stringify({
        pub: fixedWalletAddress,
        sec: "58cb156e8e089675e3ba385e8b0db1853a0a7fb39d4257030be4dca2964050dd", // Keep existing private key
        pda: fixedPdaAddress
      }));
    } else {
      // For other stores, use the saved wallet address
      const savedStoreWallet = sessionStorage.getItem("selectedStoreWallet");
      if (savedStoreWallet) {
        setStoreWalletAddress(savedStoreWallet);
        console.log("Found store wallet address:", savedStoreWallet);
      } else {
        console.warn("No wallet address found for selected store");
      }
      
      // Get store PDA from session storage
      const savedStorePda = sessionStorage.getItem("selectedStorePda");
      if (savedStorePda) {
        setStorePda(savedStorePda);
        console.log("Found store PDA address:", savedStorePda);
      }
    }
    
    // Check for Batur's wallet when username is Batur
    const username = sessionStorage.getItem("username");
    if (username === "Batur") {
      // Create a user session for Batur if not already created
      if (!sessionStorage.getItem("userWallet")) {
        sessionStorage.setItem("userWallet", "DfhzrfdE5VDk43iP1NL8MLS5xFaxquxJVFtjhjRmHLAW");
        sessionStorage.setItem("username", "Batur");
        console.log("Set up Batur's wallet address: DfhzrfdE5VDk43iP1NL8MLS5xFaxquxJVFtjhjRmHLAW");
      }
    }
  }, []);
  
  const handlePayment = async () => {
    try {
      // Check if we have Batur's wallet address when username is Batur
      const username = sessionStorage.getItem("username");
      const userWallet = sessionStorage.getItem("userWallet");
      
      if (username === "Batur" && userWallet) {
        // Use Batur's wallet directly without connecting
        console.log("Using Batur's wallet for payment:", userWallet);
      } else if (!walletAddress) {
        // Try to connect wallet first for other users
        toast.info("Connecting wallet...");
        const success = await connectWallet();
        if (!success) {
          toast.error("Please connect your wallet first");
          return;
        }
      }

      setIsProcessing(true);
      console.log("Starting payment process with wallet:", walletAddress);

      // Always use real Solana transactions
      const subtotal = parseFloat(cartTotal);

      if (!connection) {
        toast.error("Connection to Solana not established");
        setIsProcessing(false);
        return;
      }
      
      // For Sodap Watch Store (ID: 5), ensure we always have the correct wallet address
      const selectedStoreId = sessionStorage.getItem("selectedStoreId");
      if (selectedStoreId === "5" && !storeWalletAddress) {
        // Use our updated wallet address for Sodap Watch Store if missing
        const watchStoreWallet = "9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J";
        setStoreWalletAddress(watchStoreWallet);
        console.log("Using specific wallet address for Sodap Watch Store:", watchStoreWallet);
      }
      
      // Check if we have a store wallet address
      if (!storeWalletAddress) {
        toast.error("Store wallet address not found! The store may not have a wallet configured.");
        setIsProcessing(false);
        return;
      }
      
      // DIRECT APPROACH: Create a simple transaction
      try {
        // Convert the wallet and store addresses to PublicKeys
        const fromWalletPublicKey = new PublicKey(walletAddress || userWallet);
        const toStorePublicKey = new PublicKey(storeWalletAddress);
        
        console.log("Creating direct SOL transfer transaction");
        console.log(`Amount: ${subtotal} SOL`);
        console.log(`From: ${fromWalletPublicKey.toString()}`);
        console.log(`To: ${toStorePublicKey.toString()}`);
        
        // Calculate amount in lamports (1 SOL = 1,000,000,000 lamports)
        const lamports = Math.round(subtotal * LAMPORTS_PER_SOL);
        console.log(`Amount in lamports: ${lamports}`);
        
        // Create a simple transfer transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromWalletPublicKey,
            toPubkey: toStorePublicKey,
            lamports: lamports,
          })
        );
        
        // Get a recent blockhash
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromWalletPublicKey;
        
        // Send transaction using Phantom wallet
        if (!window.phantom?.solana) {
          throw new Error("Phantom wallet not detected");
        }
        
        toast.info("Please approve the transaction in your wallet");
        
        // Request signature from the user
        const signedTransaction = await window.phantom.solana.signTransaction(transaction);
        
        // Send the transaction to the network
        toast.info("Sending transaction to Solana network...");
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        toast.info("Waiting for transaction confirmation...");
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        
        // Set the transaction signature for display
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

        // Add to purchase history
        await addNewPurchase({
          transactionSignature: signature,
          receiptAddress: toStorePublicKey.toString(),
          storeAddress: storeWalletAddress,
          buyerAddress: walletAddress,
          totalAmount: parseFloat(cartTotal),
          timestamp: Math.floor(Date.now() / 1000),
          confirmed: true
        });

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
                <a href="https://solfaucet.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-500 mt-2 inline-block">
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
      {import.meta.env.DEV && (
        <div className="mt-8 border border-gray-300 rounded-md p-4 bg-gray-50 text-xs">
          <h3 className="font-semibold mb-2">Devnet Transaction Details:</h3>
          <div className="space-y-1">
            <p><strong>Store ID:</strong> {storeId}</p>
            <p><strong>User Wallet:</strong> {walletAddress || sessionStorage.getItem("userWallet") || 'Not connected'}</p>
            <p><strong>Store Wallet:</strong> {storeWalletAddress || 'Not available'}</p>
            {storePda && <p><strong>Store PDA:</strong> {storePda}</p>}
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
