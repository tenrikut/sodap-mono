
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

interface WalletStatusProps {
  isConnected: boolean;
  onConnectWallet: () => void;
}

const WalletStatus: React.FC<WalletStatusProps> = ({ isConnected, onConnectWallet }) => {
  const location = useLocation();
  const isDashboardPage = location.pathname.includes('/dashboard');
  
  // If we're on a dashboard page, don't show anything
  if (isDashboardPage) {
    return null;
  }
  
  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
        <span className="text-sm">Wallet Connected</span>
      </div>
    );
  }
  
  return (
    <Button 
      onClick={onConnectWallet} 
      variant="outline" 
      className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
    >
      Connect Wallet
    </Button>
  );
};

export default WalletStatus;
