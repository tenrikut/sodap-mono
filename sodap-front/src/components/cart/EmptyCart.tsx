
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const EmptyCart: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
      <p className="mb-6 text-muted-foreground">Looks like you haven't added any items to your cart yet.</p>
      <Button onClick={() => navigate('/shop')}>
        Continue Shopping
      </Button>
    </div>
  );
};
