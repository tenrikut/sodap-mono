
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';

interface OrderSummaryProps {
  subtotal: number;
  onCheckout: () => void;
  isConnectingWallet: boolean;
  hasItems: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  subtotal, 
  onCheckout, 
  isConnectingWallet, 
  hasItems 
}) => {
  const total = subtotal.toFixed(3);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{subtotal.toFixed(3)} SOL</span>
        </div>
        

        
        <div className="flex justify-between font-bold text-lg border-t pt-4">
          <span>Total</span>
          <span>{total} SOL</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-sodap-purple hover:bg-purple-700" 
          onClick={onCheckout}
          disabled={isConnectingWallet || !hasItems}
        >
          {isConnectingWallet ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Connecting Wallet...</span>
            </div>
          ) : (
            'Checkout'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
