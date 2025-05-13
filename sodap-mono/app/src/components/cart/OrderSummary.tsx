
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
  const [loyaltyPoints, setLoyaltyPoints] = useState(20); // Mock loyalty points
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  
  const discount = pointsToRedeem / 10; // Example: 10 points = 0.01 SOL
  const total = Math.max(0, subtotal - discount).toFixed(3);
  
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
        
        <div className="border-t pt-4">
          <p className="mb-2">Loyalty Points: {loyaltyPoints} available</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={loyaltyPoints}
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(Math.min(loyaltyPoints, parseInt(e.target.value) || 0))}
              className="border rounded px-2 py-1 w-20"
            />
            <span className="text-sm text-muted-foreground">
              Points to redeem
            </span>
          </div>
          
          {pointsToRedeem > 0 && (
            <div className="flex justify-between mt-2 text-sm">
              <span>Points discount</span>
              <span>-{discount.toFixed(3)} SOL</span>
            </div>
          )}
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
