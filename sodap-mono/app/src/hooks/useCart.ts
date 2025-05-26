
import { useState, useEffect } from 'react';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';

export const useCart = () => {
  // Load cart from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem('cart');
    try {
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error('Error parsing cart from localStorage', e);
      return [];
    }
  });
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cartItems]);
  
  const updateQuantity = (id: string, change: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.product.id === id 
          ? { ...item, quantity: Math.max(1, item.quantity + change) } 
          : item
      )
    );
  };
  
  const removeItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== id));
    toast.success("Item removed from cart");
  };
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    toast.success("Cart has been cleared");
  };

  return {
    cartItems,
    setCartItems,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
  };
};
