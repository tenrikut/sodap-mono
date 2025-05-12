import React, { useEffect, useState } from "react";
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
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/**
 * A simplified debug component that uses wallet-adapter-react directly
 * to help diagnose wallet connection issues
 */
const WalletDebugPanel: React.FC = () => {
  const { connection, program } = useAnchor();

  // Use the wallet adapter directly for more reliable connection
  const wallet = useWallet();
  const {
    publicKey,
    connected,
    connecting,
    disconnecting,
    select,
    connect,
    disconnect,
    wallets,
    wallet: selectedWallet,
  } = wallet;

  const [connectionInfo, setConnectionInfo] = useState<string>("Checking...");
  const [walletInfo, setWalletInfo] = useState<string>("No wallet selected");

  // Check connection on component mount
  useEffect(() => {
    if (connection) {
      setConnectionInfo(`Connected to: ${connection.rpcEndpoint}`);
    } else {
      setConnectionInfo("No connection available");
    }
  }, [connection]);

  // Update wallet info when wallet state changes
  useEffect(() => {
    if (connecting) {
      setWalletInfo("Connecting to wallet...");
    } else if (disconnecting) {
      setWalletInfo("Disconnecting wallet...");
    } else if (connected && publicKey) {
      setWalletInfo(
        `Connected to: ${publicKey.toString().slice(0, 8)}...${publicKey
          .toString()
          .slice(-8)}`
      );
    } else if (selectedWallet) {
      setWalletInfo(
        `Wallet ${selectedWallet.adapter.name} selected but not connected`
      );
    } else {
      setWalletInfo("No wallet selected");
    }
  }, [connecting, disconnecting, connected, publicKey, selectedWallet]);

  const handleManualConnect = async () => {
    try {
      if (!selectedWallet) {
        toast.error("Please select a wallet first");
        return;
      }

      await connect();
      toast.success("Connection request sent to wallet");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
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

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Connection Status</h3>
            <p className="text-sm">{connectionInfo}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Available Wallets</h3>
            <div className="space-y-2">
              {wallets.map((wallet) => (
                <div
                  key={wallet.adapter.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    {wallet.adapter.icon && (
                      <img
                        src={wallet.adapter.icon}
                        alt={`${wallet.adapter.name} icon`}
                        className="w-5 h-5"
                      />
                    )}
                    <span className="text-sm">{wallet.adapter.name}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      wallet.readyState === WalletReadyState.Installed
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {wallet.readyState === WalletReadyState.Installed
                      ? "Installed"
                      : wallet.readyState === WalletReadyState.Loadable
                      ? "Loadable"
                      : "Not installed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Wallet Status</h3>
            <p className="text-sm">{walletInfo}</p>
            {connected && program && (
              <p className="text-xs text-green-600 mt-1">
                Anchor program successfully initialized
              </p>
            )}
            {connected && !program && (
              <p className="text-xs text-yellow-600 mt-1">
                Connected but Anchor program not initialized
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Environment Variables</h3>
            <p className="text-xs">
              NETWORK: {import.meta.env.VITE_SOLANA_NETWORK || "Not set"}
            </p>
            <p className="text-xs break-all">
              RPC URL: {import.meta.env.VITE_SOLANA_RPC_URL || "Not set"}
            </p>
            <p className="text-xs">
              PROGRAM ID: {import.meta.env.VITE_SODAP_PROGRAM_ID || "Not set"}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="w-full flex justify-center">
            <WalletMultiButton />
          </div>

          <div className="flex justify-between w-full">
            <Button
              onClick={handleManualConnect}
              disabled={!selectedWallet || connected || connecting}
              variant="default"
              size="sm"
            >
              Manual Connect
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={!connected}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WalletDebugPanel;
