import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useToast } from "@/components/ui/use-toast";
import { handleWalletError } from "@/lib/walletErrorHandler";

interface WalletStatus {
  connected: boolean;
  connecting: boolean;
  address?: string;
  balance?: number;
}

export const useWalletConnect = () => {
  const { connect, connected, connecting, disconnect, publicKey, select, wallet } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // If no wallet is selected, open the wallet modal
      if (!wallet) {
        setVisible(true);
        return;
      }

      // If a wallet is selected but not connected, connect to it
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet.",
      });
    } catch (error) {
      const errorMessage = handleWalletError(error);
      toast({
        title: "Wallet Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect your wallet.",
        variant: "destructive",
      });
    }
  };

  const walletStatus: WalletStatus = {
    connected,
    connecting: connecting || isConnecting,
    address: publicKey?.toBase58(),
  };

  return {
    walletStatus,
    connectWallet: handleConnect,
    disconnectWallet: handleDisconnect,
  };
};
