
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartButtonProps {
  totalItems: number;
}

const CartButton: React.FC<CartButtonProps> = ({ totalItems }) => {
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/cart');
  };

  if (totalItems <= 0) {
    return null;
  }

  return (
    <button 
      onClick={handleCartClick}
      className="relative p-2 rounded-full hover:bg-gray-100"
      aria-label="View Cart"
    >
      <ShoppingCart className="h-6 w-6 text-sodap-purple" />
      <span className="absolute -top-1 -right-1 bg-sodap-purple text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {totalItems}
      </span>
    </button>
  );
};

export default CartButton;
