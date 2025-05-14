import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WALLET_CONFIG } from "@/config/wallets";
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
import { useReturnRequests } from "@/hooks/useReturnRequests";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Content component that uses the profile context
const PaymentContent: React.FC = (): React.ReactElement => {
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
  const { cartItems, setCartItems } = useCart();
  const { addNewPurchase } = usePurchaseHistory();
  const { createReturnRequest, refreshRequests } = useReturnRequests();
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

  const handleConnectWallet = async (): Promise<void> => {
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
      const fixedWalletAddress = WALLET_CONFIG.STORE_MANAGER;
      const fixedPdaAddress = "AjFmfk93LVedXVRXTdac2DWYbPYBYV6LeayyMzPU81qo";

      setStoreWalletAddress(fixedWalletAddress);
      setStorePda(fixedPdaAddress);

      // Save store wallet and PDA to session storage
      sessionStorage.setItem("selectedStoreWallet", fixedWalletAddress);
      sessionStorage.setItem("selectedStorePda", fixedPdaAddress);

      // For Batur, ensure we're using the correct buyer wallet
      const username = sessionStorage.getItem("username");
      if (username === "Batur" && !sessionStorage.getItem("userWallet")) {
        sessionStorage.setItem("userWallet", WALLET_CONFIG.DEFAULT_BUYER);
        console.log("Set up Batur's wallet:", WALLET_CONFIG.DEFAULT_BUYER);
      }

      console.log("Using store wallet:", fixedWalletAddress);
      console.log("Using store PDA:", fixedPdaAddress);

      // Save to localStorage for the admin dashboard
      localStorage.setItem(
        "sodap-store-wallet-5",
        JSON.stringify({
          pub: fixedWalletAddress,
          sec: "58cb156e8e089675e3ba385e8b0db1853a0a7fb39d4257030be4dca2964050dd", // Keep existing private key
          pda: fixedPdaAddress,
        })
      );
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
        sessionStorage.setItem("username", "Batur");
        sessionStorage.setItem("userWallet", WALLET_CONFIG.DEFAULT_BUYER);
        console.log(
          "Set up Batur's wallet address:", WALLET_CONFIG.DEFAULT_BUYER
        );
      }
    }
  }, []);

  const handlePayment = async (): Promise<void> => {
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
        const watchStoreWallet = WALLET_CONFIG.STORE_MANAGER;
        setStoreWalletAddress(watchStoreWallet);
        console.log("Using store manager wallet:", watchStoreWallet);
      }

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
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromWalletPublicKey;

        // Send transaction using wallet adapter
        if (!program?.provider.wallet) {
          throw new Error("Wallet not connected");
        }

        toast.info("Please approve the transaction in your wallet");

        // Request signature from the user using wallet adapter
        const signedTransaction = await program.provider.wallet.signTransaction(
          transaction
        );

        // Send the transaction to the network
        toast.info("Sending transaction to Solana network...");
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        // Wait for confirmation
        toast.info("Waiting for transaction confirmation...");
        const confirmation = await connection.confirmTransaction(
          signature,
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        // Set the transaction signature for display
        setTransactionSignature(signature);

        // Show success message with explorer link
        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        toast.success(
          <div>
            Payment successful!
            <br />
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500"
            >
              View transaction on Solana Explorer
            </a>
          </div>,
          { duration: 10000 }
        );

        // Create purchase data
        const purchase = {
          id: signature,
          transactionSignature: signature,
          date: new Date().toISOString(),
          storeName: sessionStorage.getItem('selectedStoreName') || 'Unknown Store',
          items: cartItems.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
          receiptAddress: signature,
          storeAddress: storeWalletAddress,
          buyerAddress: walletAddress || userWallet || WALLET_CONFIG.DEFAULT_BUYER,
          purchaseTimestamp: Math.floor(Date.now() / 1000),
          totalAmount: parseFloat(cartTotal)
        };

        // Add purchase to history
        await addNewPurchase(purchase);

        // Calculate earned points (1 point per SOL)
        const points = Math.floor(parseFloat(cartTotal));
        setEarnedPoints(points);

        // Save purchase data for potential refunds
        sessionStorage.setItem('lastPurchase', JSON.stringify(purchase));

        // Also save to purchases array
        const existingPurchases = JSON.parse(sessionStorage.getItem('purchases') || '[]');
        sessionStorage.setItem('purchases', JSON.stringify([purchase, ...existingPurchases]));

        // Create a return request automatically
        try {
          // Wait a bit to ensure purchase data is saved
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create return request
          await createReturnRequest(
            purchase,
            'Automatically created for tracking purposes'
          );

          // Refresh the requests list
          await refreshRequests();

          // Clear the cart
          setCartItems([]);
          sessionStorage.removeItem('cartTotal');
        } catch (error) {
          console.error('Error creating return request:', error);
          // Don't show error to user since this is automatic
        }

        // Show success dialog
        setShowSuccessDialog(true);

        // Clear cart
        sessionStorage.removeItem("cartItems");
        sessionStorage.removeItem("cartTotal");
      sessionStorage.removeItem("cartTotal");
      } catch (err: unknown) {
        console.error("Payment error:", err);
        let errorMessage = "Payment failed: Unknown error";

        if (err instanceof Error) {
          const errorMap = {
            "Invalid wallet address":
              "Invalid wallet address format. Please reconnect your wallet.",
            "User rejected":
              "Transaction was rejected. Please try again and approve the transaction.",
            "was not approved":
              "Transaction was rejected. Please try again and approve the transaction.",
            "insufficient funds":
              "Insufficient funds in your wallet to complete this transaction. You can get free SOL from the Solana Devnet faucet.",
            "insufficient lamports":
              "Insufficient funds in your wallet to complete this transaction. You can get free SOL from the Solana Devnet faucet.",
            "Cannot read properties of undefined":
              "Wallet connection error. Please reconnect your wallet and try again.",
            "wallet not connected":
              "Wallet connection error. Please reconnect your wallet and try again.",
            "Failed to create purchase instruction":
              "Transaction failed: The store program doesn't support this transaction type.",
            AccountNotFound:
              "The store account does not exist on Devnet. Please make sure the store is properly initialized.",
            "Account does not exist":
              "The store account does not exist on Devnet. Please make sure the store is properly initialized.",
            "custom program error":
              "Smart contract error. This could be due to incorrect program ID or the store not being properly initialized.",
          };

          // Find the first matching error message
          const matchedError = Object.entries(errorMap).find(([key]) =>
            err.message.includes(key)
          );
          if (matchedError) {
            errorMessage = matchedError[1];

            // Special handling for insufficient funds
            if (
              err.message.includes("insufficient funds") ||
              err.message.includes("insufficient lamports")
            ) {
              toast.error(
                <div>
                  {errorMessage}
                  <br />
                  <a
                    href="https://solfaucet.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-500 mt-2 inline-block"
                  >
                    Get free Devnet SOL
                  </a>
                </div>,
                { duration: 10000 }
              );
              return; // Early return to avoid double toast
            }
          } else {
            errorMessage = `Payment failed: ${err.message}`;
          }
        }

        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error("Payment error:", err);
      let errorMessage = "Payment failed: Unknown error";

      if (err instanceof Error) {
        const errorMap = {
          "Invalid wallet address":
            "Invalid wallet address format. Please reconnect your wallet.",
          "User rejected":
            "Transaction was rejected. Please try again and approve the transaction.",
          "was not approved":
            "Transaction was rejected. Please try again and approve the transaction.",
          "insufficient funds":
            "Insufficient funds in your wallet to complete this transaction. You can get free SOL from the Solana Devnet faucet.",
          "insufficient lamports":
            "Insufficient funds in your wallet to complete this transaction. You can get free SOL from the Solana Devnet faucet.",
          "Cannot read properties of undefined":
            "Wallet connection error. Please reconnect your wallet and try again.",
          "wallet not connected":
            "Wallet connection error. Please reconnect your wallet and try again.",
          "Failed to create purchase instruction":
            "Transaction failed: The store program doesn't support this transaction type.",
          AccountNotFound:
            "The store account does not exist on Devnet. Please make sure the store is properly initialized.",
          "Account does not exist":
            "The store account does not exist on Devnet. Please make sure the store is properly initialized.",
          "custom program error":
            "Smart contract error. This could be due to incorrect program ID or the store not being properly initialized.",
        };

        // Find the first matching error message
        const matchedError = Object.entries(errorMap).find(([key]) =>
          err.message.includes(key)
        );
        if (matchedError) {
          errorMessage = matchedError[1];

          // Special handling for insufficient funds
          if (
            err.message.includes("insufficient funds") ||
            err.message.includes("insufficient lamports")
          ) {
            toast.error(
              <div>
                {errorMessage}
                <br />
                <a
                  href="https://solfaucet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-500 mt-2 inline-block"
                >
                  Get free Devnet SOL
                </a>
              </div>,
              { duration: 10000 }
            );
            return; // Early return to avoid double toast
          }
        } else {
          errorMessage = `Payment failed: ${err.message}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccessDialog = (): void => {
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
            <p>
              <strong>Store ID:</strong> {storeId}
            </p>
            <p>
              <strong>User Wallet:</strong>{" "}
              {sessionStorage.getItem("username") === "Batur" ? (
                <span className="text-blue-500">
                  {sessionStorage.getItem("userWallet")} (Batur)
                </span>
              ) : (
                walletAddress || "Not connected"
              )}
            </p>
            <p>
              <strong>Store Wallet:</strong>{" "}
              {storeWalletAddress || "Not available"}
            </p>
            {storePda && (
              <p>
                <strong>Store PDA:</strong> {storePda}
              </p>
            )}
            <p>
              <strong>Amount:</strong> {cartTotal} SOL
            </p>
            {transactionSignature && (
              <p>
                <strong>Signature:</strong>{" "}
                {transactionSignature.substring(0, 8)}...
                {transactionSignature.substring(
                  transactionSignature.length - 8
                )}
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
const Payment: React.FC = (): React.ReactElement => {
  return (
    <Layout role="end_user">
      <ProfileProvider>
        <PaymentContent />
      </ProfileProvider>
    </Layout>
  );
};

export default Payment;
