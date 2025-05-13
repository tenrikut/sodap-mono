
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UserProfile {
  email: string;
  fullName: string;
  loyaltyPoints: number;
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
  loyaltyPoints: 254,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  // Get wallet address/secret from session storage if it exists, use null as fallback
  const [walletAddress, setWalletAddress] = useState<string | null>(
    () => sessionStorage.getItem('walletAddress') || null
  );
  const [walletSecret, setWalletSecret] = useState<string | null>(
    () => sessionStorage.getItem('walletSecret') || null
  );
  const [userProfile] = useState<UserProfile>(defaultUserProfile);

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
