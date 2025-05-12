import React, { useEffect, useState, useCallback } from "react";
import { useAnchor } from "@/hooks/useAnchor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletName } from "@solana/wallet-adapter-base";

/**
 * A simplified debug component for testing wallet connection
 */
const SimpleDebugger: React.FC = () => {
  const { connection, walletAddress, isConnected, program } = useAnchor();

  // Use the wallet adapter directly for more reliable connection
  const {
    connected,
    publicKey,
    connecting,
    select,
    connect,
    disconnect,
    wallet,
  } = useWallet();

  // Simple state to track connection info
  const [connectionInfo, setConnectionInfo] = useState<string>("Checking...");

  // Check connection on component mount
  useEffect(() => {
    if (connection) {
      setConnectionInfo(`Connected to: ${connection.rpcEndpoint}`);
    } else {
      setConnectionInfo("No connection available");
    }
  }, [connection]);

  // Connect wallet function moved into component to properly use hooks
  const connectWalletInComponent = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // If already connected, return success
      if (connected) {
        resolve(true);
        return;
      }

      // If no wallet is selected but there's a detected wallet, select it first
      if (!wallet && window.solana) {
        select("Phantom" as WalletName);
      }

      // Attempt to connect with timeout for better UX
      const timeoutId = setTimeout(() => {
        resolve(false); // Resolve false if it takes too long
      }, 30000); // 30 second timeout

      connect()
        .then(() => {
          clearTimeout(timeoutId);
          resolve(true);
        })
        .catch((error) => {
          console.error("Wallet connection error:", error);
          clearTimeout(timeoutId);
          resolve(false);
        });
    });
  }, [connected, wallet, select, connect]);

  // Disconnect wallet function moved into component
  const disconnectWalletInComponent = useCallback(() => {
    if (disconnect) {
      disconnect();
    }
  }, [disconnect]);

  // Handle connect
  const handleConnect = async () => {
    try {
      const success = await connectWalletInComponent();
      if (success) {
        toast.success("Wallet connected successfully");
      } else {
        toast.error("Failed to connect wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnectWalletInComponent();
    toast.success("Wallet disconnected");
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Wallet Connection Debugger</CardTitle>
          <CardDescription>
            Test your Solana connection and wallet integration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Connection Status</h3>
            <p>{connectionInfo}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Wallet Status</h3>
            <p>{isConnected ? "Connected" : "Disconnected"}</p>
            {walletAddress && (
              <p className="text-xs break-all mt-1">Address: {walletAddress}</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium">Environment Variables</h3>
            <p>NETWORK: {import.meta.env.VITE_SOLANA_NETWORK || "Not set"}</p>
            <p className="break-all">
              RPC URL: {import.meta.env.VITE_SOLANA_RPC_URL || "Not set"}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            onClick={handleConnect}
            disabled={isConnected}
            variant="default"
          >
            Connect Wallet
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={!isConnected}
            variant="outline"
          >
            Disconnect Wallet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SimpleDebugger;
