import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoyalty } from '@/hooks/useLoyalty';
import { PublicKey } from '@solana/web3.js';

interface LoyaltyPointsDisplayProps {
  storeAddress: PublicKey;
}

export function LoyaltyPointsDisplay({ storeAddress }: LoyaltyPointsDisplayProps) {
  const { loyaltyState, redeemPoints, transactions } = useLoyalty(storeAddress);

  const handleRedeem = async (amount: number) => {
    try {
      await redeemPoints(amount);
    } catch (error) {
      console.error('Error redeeming points:', error);
    }
  };

  if (loyaltyState.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[125px] w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Loyalty Points</CardTitle>
        <CardDescription>
          Earn points with every purchase and redeem them for rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Points Balance */}
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold mb-2">
              {loyaltyState.balance} points
            </h3>
            <p className="text-sm text-gray-600">Available Balance</p>
          </div>

          {/* Redemption Options */}
          {loyaltyState.balance >= 100 && (
            <div className="space-y-4">
              <h4 className="font-medium">Redeem Your Points</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleRedeem(100)}
                  disabled={loyaltyState.balance < 100}
                >
                  Redeem 100 points
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRedeem(500)}
                  disabled={loyaltyState.balance < 500}
                >
                  Redeem 500 points
                </Button>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="space-y-4">
            <h4 className="font-medium">Recent Activity</h4>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <div>
                    <p className="font-medium">
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount} points
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.transactionSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
