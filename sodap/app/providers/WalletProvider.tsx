"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter styles
require("@solana/wallet-adapter-react-ui/styles.css");

interface SolanaWalletProviderProps {
  children: ReactNode;
}

const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    // Use custom RPC URL if provided in environment, otherwise use devnet
    return (
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      clusterApiUrl(WalletAdapterNetwork.Devnet)
    );
  }, []);

  // Initialize wallet adapters with proper configuration
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        // Add any specific Phantom configuration here
        network: WalletAdapterNetwork.Devnet,
      }),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
