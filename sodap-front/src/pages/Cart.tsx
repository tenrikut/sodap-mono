import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useCart } from "@/hooks/useCart";
import { useAnchor } from "@/hooks/useAnchor";
import { CartItem } from "@/components/cart/CartItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { toast } from "sonner";

// Create a component that uses the profile context
const CartContent: React.FC = () => {
  const navigate = useNavigate();
  const { connectWallet, walletAddress, isLoading } = useAnchor();
  const { cartItems, updateQuantity, removeItem, subtotal } = useCart();

  const navigateToPayment = () => {
    console.log(
      "Navigating to payment page with cart total:",
      subtotal.toFixed(3)
    );

    // Get store ID from cart items
    // If you need storeId, ensure it exists on the product type and data.
    // For now, fallback to a default value.
    const storeId = "1";

    // Save cart details for the payment page
    sessionStorage.setItem("cartTotal", subtotal.toFixed(3));
    sessionStorage.setItem("storeId", storeId);

    // Navigate to payment page
    navigate("/payment");
  };

  const handleCheckout = async () => {
    console.log("Checkout button clicked", {
      cartItems,
      walletAddress,
      subtotal,
    });

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Check if wallet is already connected
    if (!walletAddress) {
      console.log("Wallet not connected, attempting to connect...");

      // Show wallet selection modal
      toast.info("Please select and connect your wallet to continue checkout");

      // Wait a short delay to allow UI to update, then connect wallet
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const success = await connectWallet();
        console.log("Wallet connection result:", success);

        if (success) {
          console.log("Connection successful, navigating to payment");
          navigateToPayment();
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
    } else {
      console.log("Wallet already connected, navigating to payment");
      // If wallet already connected, proceed to payment
      navigateToPayment();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.product.id}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <OrderSummary
              subtotal={subtotal}
              onCheckout={handleCheckout}
              isConnectingWallet={isLoading}
              hasItems={cartItems.length > 0}
            />
          </div>
        </div>
      ) : (
        <EmptyCart />
      )}
    </div>
  );
};

// Wrapper component that provides the Profile context
const Cart: React.FC = () => {
  return (
    <Layout role="end_user">
      <ProfileProvider>
        <CartContent />
      </ProfileProvider>
    </Layout>
  );
};

export default Cart;
