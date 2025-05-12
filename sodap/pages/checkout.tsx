import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { SolanaPayCheckout } from '../components/SolanaPayCheckout';

// Sample product data - in a real app, this would come from your backend or state
const sampleProducts = [
  { id: '1', uuid: '550e8400-e29b-41d4-a716-446655440000', name: 'Product 1', price: 0.01, image: '/product1.jpg' },
  { id: '2', uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', name: 'Product 2', price: 0.05, image: '/product2.jpg' },
  { id: '3', uuid: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: 'Product 3', price: 0.1, image: '/product3.jpg' },
];

// Cart item interface
interface CartItem {
  id: string;
  uuid: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const wallet = useWallet();
  
  // Replace with your store owner public key
  const storeOwner = 'YourStoreOwnerPublicKeyHere';
  
  // State for cart items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    // Initialize with one item for demonstration
    { ...sampleProducts[0], quantity: 1 }
  ]);
  
  // Add item to cart
  const addToCart = (productId: string) => {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;
    
    setCartItems(prevItems => {
      // Check if item is already in cart
      const existingItem = prevItems.find(item => item.id === productId);
      
      if (existingItem) {
        // Increase quantity if already in cart
        return prevItems.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.id !== productId)
    );
  };
  
  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  // Handle successful payment
  const handlePaymentSuccess = (signature: string) => {
    console.log('Payment successful!', signature);
    // In a real app, you might:
    // 1. Send the signature to your backend to verify
    // 2. Update order status in your database
    // 3. Redirect to an order confirmation page
    // 4. Clear the cart
    
    // For this demo, we'll just clear the cart
    setTimeout(() => {
      setCartItems([]);
    }, 3000);
  };
  
  // Handle payment error
  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
    // In a real app, you might:
    // 1. Log the error
    // 2. Show an error message
    // 3. Offer retry options
    alert(`Payment failed: ${error.message}`);
  };
  
  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <h1>Sodap Store Checkout</h1>
        <WalletMultiButton />
      </header>
      
      <div className="checkout-container">
        <div className="product-list">
          <h2>Products</h2>
          <div className="products-grid">
            {sampleProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {/* Replace with actual product image */}
                  <div className="placeholder-image" />
                </div>
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p className="product-price">{product.price} SOL</p>
                  <button 
                    onClick={() => addToCart(product.id)}
                    className="add-to-cart-btn"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="cart-and-checkout">
          <div className="cart">
            <h2>Shopping Cart</h2>
            {cartItems.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                <ul className="cart-items">
                  {cartItems.map(item => (
                    <li key={item.id} className="cart-item">
                      <div className="item-details">
                        <h3>{item.name}</h3>
                        <p>{item.price} SOL</p>
                      </div>
                      <div className="item-quantity">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <div className="item-total">
                        {(item.price * item.quantity).toFixed(2)} SOL
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="remove-item"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                
                <div className="cart-total">
                  <strong>Total:</strong> 
                  {cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)} SOL
                </div>
              </>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="checkout-section">
              <SolanaPayCheckout 
                storeOwner={storeOwner}
                cartItems={cartItems}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .checkout-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .checkout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .checkout-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .product-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          transition: transform 0.2s;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .placeholder-image {
          background-color: #f0f0f0;
          height: 150px;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .cart-items {
          list-style: none;
          padding: 0;
        }
        
        .cart-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        
        .item-quantity {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .item-quantity button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
        }
        
        .cart-total {
          margin-top: 20px;
          text-align: right;
          font-size: 1.2rem;
        }
        
        .checkout-section {
          margin-top: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .checkout-container {
            grid-template-columns: 1fr;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
