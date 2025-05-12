
import React from 'react';
import { Wallet, Loader, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WalletConnectorProps {
  walletAddress: string | null;
  isConnecting: boolean;
  onConnectWallet: () => void;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  walletAddress,
  isConnecting,
  onConnectWallet
}) => {
  if (walletAddress) {
    return (
      <div className="flex justify-between items-center py-2 border-t">
        <span>Wallet Address:</span>
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[170px] text-sm">{walletAddress}</span>
          <Check className="h-4 w-4 text-green-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t py-4">
      <Alert variant="destructive" className="mb-3 bg-amber-50 text-amber-800 border-amber-200">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Wallet not connected. Please connect your Phantom wallet to continue with payment.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={onConnectWallet} 
        disabled={isConnecting}
        className="w-full flex items-center justify-center gap-2"
        variant="outline"
      >
        {isConnecting ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Phantom Wallet</span>
          </>
        )}
      </Button>
    </div>
  );
};
