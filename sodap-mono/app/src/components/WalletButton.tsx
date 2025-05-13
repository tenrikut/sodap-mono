import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Loader, Check } from "lucide-react";

export const WalletButton: React.FC = () => {
  const { connected, connecting } = useWallet();

  if (connected) {
    return (
      <Button
        variant="outline"
        className="border-green-500 text-green-500 hover:bg-green-50"
        disabled
      >
        <Check className="w-4 h-4 mr-2" />
        Connected
      </Button>
    );
  }

  return (
    <WalletMultiButton className="wallet-adapter-button">
      {connecting ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </WalletMultiButton>
  );
};
