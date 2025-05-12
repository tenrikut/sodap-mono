"use client";
import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button, HStack, Text, useToast, Box } from "@chakra-ui/react";
import {
  handleWalletError,
  isPhantomInstalled,
} from "../utils/walletErrorHandler";

// Import styles
require("@solana/wallet-adapter-react-ui/styles.css");

const WalletConnect: FC = () => {
  const { wallet, connect, disconnect, connected, connecting, publicKey } =
    useWallet();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPhantomAvailable, setIsPhantomAvailable] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Check if Phantom is installed
    setIsPhantomAvailable(isPhantomInstalled());
  }, []);

  useEffect(() => {
    if (errorMessage) {
      toast({
        title: "Wallet Connection Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setErrorMessage(null);
    }
  }, [errorMessage, toast]);

  const handleConnect = async () => {
    try {
      setErrorMessage(null);
      if (!wallet) {
        throw new Error("No wallet selected");
      }
      await connect().catch((error) => {
        console.error("Connection error:", error);
        setErrorMessage(handleWalletError(error));
      });
    } catch (error) {
      console.error("Connection error:", error);
      setErrorMessage(handleWalletError(error));
    }
  };

  if (!isPhantomAvailable) {
    return (
      <Box>
        <Button
          as="a"
          href="https://phantom.app/"
          target="_blank"
          rel="noopener noreferrer"
          colorScheme="purple"
          size="sm"
        >
          Install Phantom
        </Button>
      </Box>
    );
  }

  return (
    <HStack spacing={4}>
      {connected ? (
        <>
          <Text fontSize="sm">
            {publicKey?.toString().slice(0, 4)}...
            {publicKey?.toString().slice(-4)}
          </Text>
          <Button
            colorScheme="red"
            size="sm"
            onClick={disconnect}
            isLoading={connecting}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <WalletMultiButton />
      )}
    </HStack>
  );
};

export default WalletConnect;
