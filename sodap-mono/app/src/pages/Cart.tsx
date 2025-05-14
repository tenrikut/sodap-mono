import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/CartItem";
import type { CartItem as CartItemType } from "@/types/cart";
import { useCart } from "@/hooks/useCart";
import { useAnchor } from "@/hooks/useAnchor";
import { toast } from "sonner";

// Create a component that uses the profile context
const CartContent: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, setCartItems, updateQuantity, removeItem } = useCart();
  const { walletAddress } = useAnchor();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Get the selected store ID from session storage
  const selectedStoreId = sessionStorage.getItem("selectedStoreId");

  // Calculate subtotal
  const subtotal = cartItems.reduce((acc, item: CartItemType) => acc + (item.product.price * item.quantity), 0);

  // Function to navigate to store selection
  const navigateToStoreSelection = () => {
    navigate("/store-selection");
  };

  const handleCheckout = () => {
    try {
      if (cartItems.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      // Check if a store is selected
      if (!selectedStoreId) {
        toast.info("Please select a store to continue");
        navigateToStoreSelection();
        return;
      }

      // Save cart total for the payment page
      sessionStorage.setItem("cartTotal", subtotal.toString());

      // Navigate to payment page with store ID
      navigate(`/payment?storeId=${selectedStoreId}`);
    } catch (error) {
      console.error("Unexpected error in handleCheckout:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart items */}
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            ))}
          </div>

          {/* Cart summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Subtotal:</span>
              <span>{subtotal} SOL</span>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isProcessingPayment || cartItems.length === 0}
              >
                {isProcessingPayment ? "Processing..." : "Proceed to Checkout"}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/store-selection")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides the Profile context
const Cart = () => {
  return (
    <Layout role="end_user">
      <CartContent />
    </Layout>
  );
};

export default Cart;
