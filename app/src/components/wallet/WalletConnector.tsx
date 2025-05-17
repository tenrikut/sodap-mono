import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Wallet,
  Loader,
  Check,
  ArrowDownLeft,
} from "lucide-react";
import { handleWalletError } from "@/lib/walletErrorHandler";
import { useToast } from "@/components/ui/use-toast";

export const WalletConnector: React.FC = () => {
  const { connect, disconnect, connecting, connected, publicKey } = useWallet();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      const errorMessage = handleWalletError(error);
      toast({
        title: "Wallet Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-4 border p-3 rounded-lg bg-white">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm text-gray-600">
            {publicKey.toString().slice(0, 4)}...
            {publicKey.toString().slice(-4)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <ArrowDownLeft className="h-4 w-4 mr-1" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Alert
        variant="destructive"
        className="bg-amber-50 text-amber-800 border-amber-200"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Please connect your wallet to access this functionality.
        </AlertDescription>
      </Alert>

      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2 bg-sodap-purple hover:bg-sodap-purple/90"
      >
        {connecting ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </>
        )}
      </Button>
    </div>
  );
};
