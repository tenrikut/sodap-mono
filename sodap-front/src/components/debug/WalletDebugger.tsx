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

/**
 * A debug component for testing wallet connection and Solana RPC connectivity
 */
const WalletDebugger: React.FC = () => {
  const {
    connection,
    connectWallet,
    disconnectWallet,
    walletAddress,
    isConnected,
    program,
  } = useAnchor();

  const [connectionStatus, setConnectionStatus] =
    useState<string>("Checking...");
  const [rpcUrl, setRpcUrl] = useState<string>("Unknown");
  const [solanaEnv, setSolanaEnv] = useState<string>("Unknown");
  const [blockHeight, setBlockHeight] = useState<number | null>(null);

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if we have a connection
        if (!connection) {
          setConnectionStatus("No connection available");
          return;
        }

        // Try to get RPC URL
        setRpcUrl(connection.rpcEndpoint);

        // Determine environment from RPC endpoint
        if (connection.rpcEndpoint.includes("devnet")) {
          setSolanaEnv("Devnet");
        } else if (connection.rpcEndpoint.includes("testnet")) {
          setSolanaEnv("Testnet");
        } else if (connection.rpcEndpoint.includes("mainnet")) {
          setSolanaEnv("Mainnet");
        } else if (connection.rpcEndpoint.includes("localhost")) {
          setSolanaEnv("Local");
        }

        // Test connection by getting block height
        const height = await connection.getBlockHeight("finalized");
        setBlockHeight(height);
        setConnectionStatus("Connected");
      } catch (error) {
        console.error("Connection test failed:", error);
        setConnectionStatus(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    };

    checkConnection();
  }, [connection]);

  // Handle connect
  const handleConnect = async () => {
    try {
      const success = await connectWallet();
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
    disconnectWallet();
    toast.success("Wallet disconnected");
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Wallet & Connection Debugger</CardTitle>
          <CardDescription>
            Test your Solana connection and wallet integration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Solana Connection</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={
                  connectionStatus === "Connected"
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {connectionStatus}
              </span>

              <span className="text-muted-foreground">RPC URL:</span>
              <span className="break-all">{rpcUrl}</span>

              <span className="text-muted-foreground">Environment:</span>
              <span>{solanaEnv}</span>

              <span className="text-muted-foreground">Block Height:</span>
              <span>
                {blockHeight !== null
                  ? blockHeight.toLocaleString()
                  : "Unknown"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Wallet</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className={isConnected ? "text-green-500" : "text-red-500"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>

              <span className="text-muted-foreground">Address:</span>
              <span className="break-all">{walletAddress || "None"}</span>

              <span className="text-muted-foreground">Program:</span>
              <span>{program ? "Initialized" : "Not initialized"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Environment Variables</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">
                VITE_SOLANA_NETWORK:
              </span>
              <span>{import.meta.env.VITE_SOLANA_NETWORK || "Not set"}</span>

              <span className="text-muted-foreground">
                VITE_SOLANA_RPC_URL:
              </span>
              <span className="break-all">
                {import.meta.env.VITE_SOLANA_RPC_URL || "Not set"}
              </span>

              <span className="text-muted-foreground">
                VITE_SODAP_PROGRAM_ID:
              </span>
              <span>{import.meta.env.VITE_SODAP_PROGRAM_ID || "Not set"}</span>
            </div>
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

export default WalletDebugger;
