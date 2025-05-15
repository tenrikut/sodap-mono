import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useToast } from '@/hooks/use-toast';

interface LoyaltyTabProps {
  storeAddress: PublicKey;
}

export function LoyaltyTab({ storeAddress }: LoyaltyTabProps) {
  const { toast } = useToast();
  const {
    loyaltyState,
    initializeLoyalty,
    transactions,
  } = useLoyalty(storeAddress);

  const [pointsPerSol, setPointsPerSol] = useState('100');
  const [redemptionRate, setRedemptionRate] = useState('100');

  const handleInitialize = async () => {
    try {
      await initializeLoyalty(storeAddress);
      toast({
        title: 'Success',
        description: 'Loyalty program initialized successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize loyalty program',
        variant: 'destructive',
      });
    }
  };

  if (loyaltyState.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[125px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Program Settings</CardTitle>
          <CardDescription>
            Configure your store's loyalty program settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loyaltyState.isInitialized ? (
            <div className="space-y-4">
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="pointsPerSol">Points per SOL</Label>
                  <Input
                    id="pointsPerSol"
                    value={pointsPerSol}
                    onChange={(e) => setPointsPerSol(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="redemptionRate">
                    Redemption Rate (points per SOL)
                  </Label>
                  <Input
                    id="redemptionRate"
                    value={redemptionRate}
                    onChange={(e) => setRedemptionRate(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>
              <Button onClick={handleInitialize} className="w-full">
                Initialize Loyalty Program
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points Balance</Label>
                  <p className="text-2xl font-bold">{loyaltyState.balance}</p>
                </div>
                <div className="space-y-2">
                  <Label>Total Points Issued</Label>
                  <p className="text-2xl font-bold">
                    {transactions.reduce(
                      (acc, tx) => (tx.type === 'earn' ? acc + tx.amount : acc),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loyaltyState.isInitialized && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Recent loyalty point transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">
                      {tx.type === 'earn' ? 'Earned' : 'Redeemed'} {tx.amount}{' '}
                      points
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.transactionSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View Transaction
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
