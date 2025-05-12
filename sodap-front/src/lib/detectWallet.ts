/**
 * Helper function to detect if Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      // @ts-ignore - Phantom types are complex and we only need to check existence
      typeof window.phantom?.solana?.isPhantom === "boolean"
    );
  } catch {
    return false;
  }
}

/**
 * Helper to get wallet adapter network name
 */
export function getNetworkName(network: string): string {
  switch (network) {
    case "mainnet-beta":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "devnet":
      return "Devnet";
    default:
      return "Unknown Network";
  }
}

/**
 * Helper to check if a wallet address is valid
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    if (!address) return false;
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}
