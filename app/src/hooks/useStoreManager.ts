import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const STORE_MANAGER_WALLET = '9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J';

export const useStoreManager = () => {
  const { data: session } = useSession();
  const { publicKey, connected } = useWallet();
  const [isStoreManager, setIsStoreManager] = useState(false);

  useEffect(() => {
    const checkStoreManager = () => {
      // Check if user is logged in as manager
      if (session?.user?.email !== 'manager@sodap.com') {
        setIsStoreManager(false);
        return;
      }

      // Check if wallet is connected and matches store manager's wallet
      if (!connected || !publicKey) {
        setIsStoreManager(false);
        return;
      }

      const isCorrectWallet = publicKey.toBase58() === STORE_MANAGER_WALLET;
      setIsStoreManager(isCorrectWallet);

      if (!isCorrectWallet && connected) {
        toast.error('Please connect with the store manager wallet');
      }
    };

    checkStoreManager();
  }, [session, publicKey, connected]);

  return {
    isStoreManager,
    requiredWallet: STORE_MANAGER_WALLET,
    isManagerEmail: session?.user?.email === 'manager@sodap.com'
  };
};
