
import { useState, useEffect } from 'react';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

export const useHeaderCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCartFromStorage = () => {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
          setCartItems([]);
        }
      }
    };

    // Load initial cart
    loadCartFromStorage();

    // Set up event listener for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cart') {
        loadCartFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    const handleCustomStorageChange = () => loadCartFromStorage();
    window.addEventListener('cartUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCustomStorageChange);
    };
  }, []);

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { cartItems, totalCartItems };
};
