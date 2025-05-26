
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, LogOut, Wallet, Check, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WalletStatusProps {
  isConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  onDisconnectWallet?: () => void;
  onChangeWallet?: () => void;
}

const WalletStatus: React.FC<WalletStatusProps> = ({ 
  isConnected, 
  walletAddress = '', 
  onConnectWallet,
  onDisconnectWallet = () => {}, 
  onChangeWallet = () => {}
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const isDashboardPage = location.pathname.includes('/dashboard');
  
  // Handle wallet disconnect action
  const handleDisconnect = () => {
    // Disconnect wallet
    onDisconnectWallet();
    
    // Show toast notification
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };
  
  // If we're on a dashboard page, don't show anything
  if (isDashboardPage) {
    return null;
  }

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard"
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const truncatedAddress = walletAddress 
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` 
    : '';
  
  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="border-green-500 text-green-700 hover:bg-green-50 flex items-center gap-2"
          >
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">{truncatedAddress}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-500">
            <span>Wallet</span>
            <span className="font-mono">{truncatedAddress}</span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onChangeWallet} className="cursor-pointer">
            <Wallet className="mr-2 h-4 w-4" />
            <span>Change Wallet</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-500 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <Button 
      onClick={onConnectWallet} 
      variant="outline" 
      className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5 flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </Button>
  );
};

export default WalletStatus;
