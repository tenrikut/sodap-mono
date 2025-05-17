
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { WalletConnector } from './WalletConnector';

interface PaymentDetailsCardProps {
  cartTotal: string;
  walletAddress: string | null;
  isConnecting: boolean;
  isProcessing: boolean;
  onConnectWallet: () => void;
  onPayment: () => void;
}

export const PaymentDetailsCard: React.FC<PaymentDetailsCardProps> = ({
  cartTotal,
  walletAddress,
  isConnecting,
  isProcessing,
  onConnectWallet,
  onPayment
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between py-2">
          <span>Total Amount:</span>
          <span className="font-bold">{cartTotal} SOL</span>
        </div>
        
        <WalletConnector 
          walletAddress={walletAddress} 
          isConnecting={isConnecting}
          onConnectWallet={onConnectWallet}
        />
        
        <div className="bg-muted/50 p-4 rounded-md mt-4">
          <p className="text-sm">
            By clicking "Complete Payment", you agree to the Terms of Service and Privacy Policy.
            The payment will be processed through the Solana blockchain.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-sodap-purple hover:bg-purple-700"
          onClick={onPayment}
          disabled={isProcessing || !walletAddress || isConnecting}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Processing Payment...</span>
            </div>
          ) : (
            "Complete Payment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
