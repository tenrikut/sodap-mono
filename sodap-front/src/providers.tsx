import { FC, PropsWithChildren, useEffect } from "react";
import { SodapAnchorProvider } from "./contexts/AnchorContext";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
import { getSolanaConfig } from "./lib/solana";
import { useToast } from "@/components/ui/use-toast";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

// Wallet status and error monitor component
const WalletMonitor: FC = () => {
  const { connected, connecting, disconnecting, publicKey } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    if (connected && publicKey) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${publicKey.toBase58().slice(0, 8)}...`,
      });
    }
  }, [connected, publicKey, toast]);

  useEffect(() => {
    if (!connected && !connecting && !disconnecting) {
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
        variant: "default",
      });
    }
  }, [connected, connecting, disconnecting, toast]);

  return null;
};

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  const { endpoint, network } = getSolanaConfig();
  const { toast } = useToast();

  // Initialize supported wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  // Error handler for wallet operations
  const onError = useMemo(
    () => async (error: Error) => {
      console.error("Wallet error:", error);

      // Log additional details for debugging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      // Capture wallet adapter state
      try {
        const adapterState = wallets.map((wallet) => ({
          name: wallet.name,
          readyState: wallet.readyState,
          connected: wallet.connected,
        }));
        console.log("Wallet adapter state:", adapterState);
      } catch (stateError) {
        console.error("Failed to capture wallet adapter state:", stateError);
      }

      // Display a user-friendly error message
      toast({
        title: "Wallet Error",
        description: error.message,
        variant: "destructive",
      });
    },
    [toast, wallets]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          <WalletMonitor />
          <SodapAnchorProvider>{children}</SodapAnchorProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
