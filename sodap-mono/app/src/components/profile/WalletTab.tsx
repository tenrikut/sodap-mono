
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Wallet, Copy, Eye, EyeOff } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Keypair } from '@solana/web3.js';

interface WalletTabProps {
  isAdmin?: boolean;
}

const WalletTab: React.FC<WalletTabProps> = ({ isAdmin = false }) => {
  const { walletAddress, setWalletAddress, walletSecret, setWalletSecret } = useProfile();
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const { toast } = useToast();
  
  // Check localStorage for existing wallet on component mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('sodap-wallet');
    if (storedWallet) {
      try {
        const walletData = JSON.parse(storedWallet);
        setWalletAddress(walletData.pub);
        setWalletSecret(walletData.sec);
        setHasWallet(true);
      } catch (error) {
        console.error('Error parsing stored wallet data:', error);
      }
    }
  }, [setWalletAddress, setWalletSecret]);

  /**
   * Generate a Solana keypair and store it in state and localStorage
   */
  const generateSolanaKeypair = () => {
    setIsCreatingWallet(true);
    
    try {
      // Generate a real Solana keypair
      const kp = Keypair.generate();
      
      // Convert public key to base58 and secret key to hex
      const publicKey = kp.publicKey.toBase58();
      const secretKey = Buffer.from(kp.secretKey).toString('hex');
      
      // Store in state
      setWalletAddress(publicKey);
      setWalletSecret(secretKey);
      setHasWallet(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('sodap-wallet', JSON.stringify({
        pub: publicKey,
        sec: secretKey
      }));
      
      toast({
        title: "Wallet Created",
        description: "Your Solana wallet has been generated successfully. Keep your secret key safe!",
      });
    } catch (error) {
      console.error("Error generating Solana wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: "There was an error creating your Solana wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} Copied`,
      description: `The ${type.toLowerCase()} has been copied to clipboard.`,
    });
  };

  const toggleSecretVisibility = () => {
    setIsSecretVisible(!isSecretVisible);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Management</CardTitle>
        <p className="text-gray-500">Create and manage your Solana wallet directly from your profile.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasWallet ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet size={48} className="mb-4 text-sodap-purple" />
            <h3 className="text-xl font-medium mb-2">No Wallet Found</h3>
            <p className="text-gray-500 mb-4">Create a wallet to start using SoDap payments</p>
            <Button 
              onClick={generateSolanaKeypair} 
              className="bg-sodap-purple hover:bg-sodap-purple/90"
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? "Creating..." : "Create Wallet"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Address</h3>
              <div className="flex items-center">
                <Input
                  readOnly
                  value={walletAddress}
                  className="flex-1 font-mono text-sm rounded-r-none"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-[42px] rounded-l-none border-l-0"
                  onClick={() => copyToClipboard(walletAddress, "Address")}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Secret Key <span className="text-red-500">(Keep this safe!)</span>
              </h3>
              <div className="flex items-center">
                <Input
                  readOnly
                  type={isSecretVisible ? "text" : "password"} 
                  value={walletSecret || ''}
                  className="flex-1 font-mono text-sm rounded-r-none"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-[42px] rounded-none border-l-0 border-r-0"
                  onClick={toggleSecretVisibility}
                >
                  {isSecretVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-[42px] rounded-l-none border-l-0"
                  onClick={() => copyToClipboard(walletSecret || '', "Secret")}
                  disabled={!walletSecret}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <p className="text-sm text-red-500 mt-2">
                Important: Store this secret safely; it cannot be recovered if lost.
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Balance</h3>
              <p className="text-xl font-bold">0.00 SOL</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletTab;
