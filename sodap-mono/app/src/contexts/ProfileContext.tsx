
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface UserProfile {
  email: string;
  fullName: string;
}

interface ProfileContextType {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  walletSecret: string | null;
  setWalletSecret: (secret: string | null) => void;
  userProfile: UserProfile;
}

const defaultUserProfile = {
  email: "user@example.com",
  fullName: "John Doe",
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  // Get wallet address/secret from localStorage if it exists, use null as fallback
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    // Try to get from localStorage first
    const storedWallet = localStorage.getItem('sodap-wallet');
    if (storedWallet) {
      try {
        const walletData = JSON.parse(storedWallet);
        return walletData.pub || null;
      } catch (error) {
        console.error('Error parsing stored wallet data:', error);
        return null;
      }
    }
    return null;
  });
  
  const [walletSecret, setWalletSecret] = useState<string | null>(() => {
    // Try to get from localStorage first
    const storedWallet = localStorage.getItem('sodap-wallet');
    if (storedWallet) {
      try {
        const walletData = JSON.parse(storedWallet);
        return walletData.sec || null;
      } catch (error) {
        console.error('Error parsing stored wallet data:', error);
        return null;
      }
    }
    return null;
  });
  
  const [userProfile] = useState<UserProfile>(defaultUserProfile);

  // Update localStorage when wallet address or secret changes
  useEffect(() => {
    if (walletAddress && walletSecret) {
      localStorage.setItem('sodap-wallet', JSON.stringify({
        pub: walletAddress,
        sec: walletSecret
      }));
    }
  }, [walletAddress, walletSecret]);

  return (
    <ProfileContext.Provider
      value={{
        walletAddress,
        setWalletAddress,
        walletSecret,
        setWalletSecret,
        userProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
