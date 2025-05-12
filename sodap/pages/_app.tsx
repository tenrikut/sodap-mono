import type { AppProps } from 'next/app';
import { WalletContextProvider } from '../components/WalletContextProvider';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Set to devnet for testing, change to mainnet-beta for production
  const network = WalletAdapterNetwork.Devnet;
  
  return (
    <WalletContextProvider network={network}>
      <Component {...pageProps} />
    </WalletContextProvider>
  );
}
