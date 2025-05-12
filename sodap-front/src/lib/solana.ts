import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection } from "@solana/web3.js";

const network =
  (import.meta.env.VITE_SOLANA_NETWORK as WalletAdapterNetwork) ||
  WalletAdapterNetwork.Devnet;

export function getSolanaConfig() {
  const endpoint =
    import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);
  const programId = import.meta.env.VITE_SODAP_PROGRAM_ID;

  return {
    network,
    endpoint,
    programId,
  };
}

let _connection: Connection | null = null;

export function getSolanaConnection() {
  if (!_connection) {
    const { endpoint } = getSolanaConfig();
    _connection = new Connection(endpoint, "confirmed");
  }
  return _connection;
}
