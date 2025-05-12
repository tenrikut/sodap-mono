import React from "react";
import { Button } from "@/components/ui/button";
import { useAnchor } from "@/hooks/useAnchor";
import { toast } from "sonner";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface WalletConnectButtonProps {
  label?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * A custom wallet connect button that ensures proper wallet connection
 * before proceeding with checkout
 */
const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  label = "Connect Wallet",
  variant = "default",
  className = "",
  size = "default",
}) => {
  const { walletAddress, isConnected, connectWallet } = useAnchor();

  const handleConnectClick = async () => {
    if (isConnected) {
      toast.info("Wallet already connected!");
      return;
    }

    try {
      // This will trigger the wallet selection modal
      const walletBtn = document.querySelector(
        ".wallet-adapter-button-trigger"
      );
      if (walletBtn instanceof HTMLElement) {
        walletBtn.click();
      } else {
        // Fallback to manual connection
        const connected = await connectWallet();
        if (!connected) {
          toast.error("Failed to connect wallet. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Error connecting wallet. Please try again.");
    }
  };

  return (
    <>
      {/* Hidden wallet multi-button for connecting */}
      <div className="hidden">
        <WalletMultiButton />
      </div>

      {/* Custom styled button that triggers the wallet adapter */}
      <Button
        variant={variant}
        className={className}
        size={size}
        onClick={handleConnectClick}
      >
        {isConnected
          ? `Connected: ${walletAddress?.slice(0, 4)}...${walletAddress?.slice(
              -4
            )}`
          : label}
      </Button>
    </>
  );
};

export default WalletConnectButton;
