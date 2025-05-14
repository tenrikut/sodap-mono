import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useStoreManager } from '@/hooks/useStoreManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const WalletConnect = () => {
  const { connected } = useWallet();
  const { isStoreManager, requiredWallet, isManagerEmail } = useStoreManager();

  if (!isManagerEmail) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Store Wallet</h2>
        <WalletMultiButton />
      </div>

      {connected && !isStoreManager && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Wallet Connected</AlertTitle>
          <AlertDescription>
            Please connect with the store manager wallet:{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              {requiredWallet}
            </code>
          </AlertDescription>
        </Alert>
      )}

      {isStoreManager && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Store Wallet Connected</AlertTitle>
          <AlertDescription>
            You are connected with the correct store manager wallet.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
