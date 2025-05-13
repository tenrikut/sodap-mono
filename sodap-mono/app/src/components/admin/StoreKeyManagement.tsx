import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Keypair } from "@solana/web3.js";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff, Wallet, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PROGRAM_ID } from "@/utils/anchor";

interface StoreKeyManagementProps {
  storeId: string;
  storeName: string;
}

// Define store interface for type safety
interface StoreData {
  id: string;
  name: string;
  description: string;
  managerId: string;
  managerName: string;
  revenue: string;
  products: number;
  customers: number;
  walletCreated?: boolean;
  walletAddress?: string;
  hasPda?: boolean;
  pdaAddress?: string;
}

export const StoreKeyManagement: React.FC<StoreKeyManagementProps> = ({
  storeId,
  storeName
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletSecret, setWalletSecret] = useState<string>('');
  const [manualWalletAddress, setManualWalletAddress] = useState<string>('');
  const [manualWalletSecret, setManualWalletSecret] = useState<string>('');
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [isManualSecretVisible, setIsManualSecretVisible] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isValidatingWallet, setIsValidatingWallet] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [walletInputError, setWalletInputError] = useState<string>('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  
  // PDA state
  const [pdaAddress, setPdaAddress] = useState<string>('');
  const [isCreatingPda, setIsCreatingPda] = useState(false);
  const [hasPda, setHasPda] = useState(false);

  /**
   * Helper function to update store data in session storage
   */
  const updateStoreDataInSessionStorage = useCallback((updates: {
    walletCreated?: boolean;
    walletAddress?: string;
    hasPda?: boolean;
    pdaAddress?: string;
  }) => {
    const storesData = sessionStorage.getItem('storesData');
    if (storesData) {
      const stores: StoreData[] = JSON.parse(storesData);
      const updatedStores = stores.map(store => {
        if (store.id === storeId) {
          return { ...store, ...updates };
        }
        return store;
      });
      sessionStorage.setItem('storesData', JSON.stringify(updatedStores));
    } else {
      console.warn('No stores data found in session storage');
    }
  }, [storeId]);

  /**
   * Create a Program Derived Address (PDA) for the store
   */
  const createStorePda = useCallback(async () => {
    if (!walletAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please create a store wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!publicKey) {
      toast({
        title: 'Admin wallet needed',
        description: 'Please connect your admin wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingPda(true);

    try {
      // Create a buffer for the seed
      const storeKeyBuffer = new PublicKey(walletAddress).toBuffer();
      
      // Find the PDA
      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('store'),
          storeKeyBuffer,
        ],
        new PublicKey(PROGRAM_ID)
      );
      
      // Save the PDA
      setPdaAddress(pda.toString());
      setHasPda(true);
      
      // Update localStorage
      const storedWallet = localStorage.getItem(`sodap-store-wallet-${storeId}`);
      if (storedWallet) {
        const walletData = JSON.parse(storedWallet);
        localStorage.setItem(`sodap-store-wallet-${storeId}`, JSON.stringify({
          ...walletData,
          pda: pda.toString()
        }));
      }
      
      // Update session storage
      updateStoreDataInSessionStorage({
        hasPda: true,
        pdaAddress: pda.toString()
      });
      
      toast({
        title: 'PDA Created',
        description: `Store PDA: ${pda.toString().slice(0, 10)}...`,
      });
      
    } catch (error) {
      console.error('Error creating PDA:', error);
      toast({
        title: 'PDA Creation Failed',
        description: 'There was an error creating the PDA',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPda(false);
    }
  }, [publicKey, storeId, toast, updateStoreDataInSessionStorage, walletAddress]);

  // Check localStorage for existing wallet on component mount
  useEffect(() => {
    // Log that we're initializing with this store ID
    console.log(`Initializing StoreKeyManagement with store ID: ${storeId}`);
    
    // Set up mock user authentication if needed (for demo purposes)
    if (!sessionStorage.getItem('username')) {
      sessionStorage.setItem('username', 'admin');
      sessionStorage.setItem('userRole', 'platform_admin');
    }
    
    const storedWallet = localStorage.getItem(`sodap-store-wallet-${storeId}`);
    if (storedWallet) {
      try {
        const walletData = JSON.parse(storedWallet);
        if (walletData.pub) {
          setWalletAddress(walletData.pub);
          setWalletSecret(walletData.sec || '');
          setHasWallet(true);
          
          // Check if PDA was also stored
          if (walletData.pda) {
            setPdaAddress(walletData.pda);
            setHasPda(true);
          }
        } else {
          console.warn('Stored wallet data missing public key for store:', storeId);
        }
      } catch (error: any) {
        console.error('Error parsing stored wallet data:', error);
      }
    } else {
      console.log(`No wallet data found for store: ${storeId}`);
      
      // Special case for Sodap Watch Store (ID: 5)
      // Automatically set up a wallet for this store if it doesn't have one
      if (storeId === '5') {
        console.log('Automatically setting up wallet for Sodap Watch Store');
        // Create a deterministic wallet for store ID 5
        const walletPublicKey = 'Gx58a8WY4FMEgvkVzMjFC8baKvnACqy1MiJxjdoLLLx8';
        const walletSecretKey = '58cb156e8e089675e3ba385e8b0db1853a0a7fb39d4257030be4dca2964050dd';
        
        // Save to state
        setWalletAddress(walletPublicKey);
        setWalletSecret(walletSecretKey);
        setHasWallet(true);
        
        // Save to localStorage
        localStorage.setItem(`sodap-store-wallet-${storeId}`, JSON.stringify({
          pub: walletPublicKey,
          sec: walletSecretKey
        }));
        
        // Update session storage
        updateStoreDataInSessionStorage({
          walletCreated: true,
          walletAddress: walletPublicKey
        });
        
        // Create PDA for this store automatically
        setTimeout(() => createStorePda(), 500);
      }
    }
  }, [storeId, updateStoreDataInSessionStorage, createStorePda]);
  
  // Auto-create PDA for Sodap Watch Store
  useEffect(() => {
    if (storeId === '5' && hasWallet && !hasPda && walletAddress) {
      console.log('Automatically creating PDA for Sodap Watch Store');
      createStorePda();
    }
  }, [storeId, hasWallet, hasPda, walletAddress, createStorePda]);

  /**
   * Validates a Solana public key
   */
  const isValidSolanaPublicKey = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Save a manually entered wallet address
   */
  const saveManualWallet = () => {
    setIsValidatingWallet(true);
    setWalletInputError('');
    
    try {
      if (!manualWalletAddress.trim()) {
        setWalletInputError('Wallet address cannot be empty');
        return;
      }
      
      // Validate the wallet address is a proper Solana public key
      if (!isValidSolanaPublicKey(manualWalletAddress)) {
        setWalletInputError('Invalid Solana wallet address format');
        return;
      }
      
      // Store in state
      setWalletAddress(manualWalletAddress);
      setWalletSecret(manualWalletSecret || ''); // Use manually entered secret if provided
      setHasWallet(true);
      
      // Store in localStorage for persistence
      localStorage.setItem(`sodap-store-wallet-${storeId}`, JSON.stringify({
        pub: manualWalletAddress,
        sec: manualWalletSecret || '', // Store secret if provided
        pda: pdaAddress // Keep existing PDA if any
      }));
      
      // Update the store data in session storage to reflect wallet creation
      updateStoreDataInSessionStorage({
        walletCreated: true,
        walletAddress: manualWalletAddress
      });
      
      // Clear the input fields
      setManualWalletAddress('');
      setManualWalletSecret('');
      setShowSecretInput(false);
      
      toast({
        title: "Wallet Address Saved",
        description: `Wallet address for store "${storeName}" has been saved successfully.`,
      });
    } catch (error) {
      console.error("Error saving wallet address:", error);
      toast({
        title: "Failed to Save Wallet Address",
        description: "There was an error saving the wallet address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingWallet(false);
    }
  };

  // Define store interface for type safety
  // This duplicate interface should be removed
interface StoreData2 {
    id: string;
    name: string;
    description: string;
    managerId: string;
    managerName: string;
    revenue: string;
    products: number;
    customers: number;
    walletCreated?: boolean;
    walletAddress?: string;
    hasPda?: boolean;
    pdaAddress?: string;
    [key: string]: any; // For any other properties that might exist
  }

  /**
   * Helper function to update store data in session storage
   */
  // This duplicate function should be removed
const updateStoreDataInSessionStorage2 = (updates: {
    walletCreated?: boolean;
    walletAddress?: string;
    hasPda?: boolean;
    pdaAddress?: string;
  }) => {
    try {
      // Get current stores from session storage
      const storedStores = sessionStorage.getItem('sodap-stores');
      if (storedStores) {
        const stores = JSON.parse(storedStores) as StoreData[];
        
        // Find and update the current store
        const updatedStores = stores.map((store: StoreData) => {
          if (store.id === storeId) {
            return { ...store, ...updates };
          }
          return store;
        });
        
        // Save back to session storage
        sessionStorage.setItem('sodap-stores', JSON.stringify(updatedStores));
        console.log(`Updated store ${storeId} in session storage with:`, updates);
      }
    } catch (error) {
      console.error('Error updating store data in session storage:', error);
    }
  };

  /**
   * Generate a Solana keypair for the store and store it locally
   */
  const generateStoreWallet = () => {
    setIsCreatingWallet(true);
    
    try {
      // Generate a real Solana keypair
      const kp = Keypair.generate();
      
      // Convert public key to base58 and secret key to hex
      const publicKeyStr = kp.publicKey.toBase58();
      const secretKeyStr = Buffer.from(kp.secretKey).toString('hex');
      
      // Store in state
      setWalletAddress(publicKeyStr);
      setWalletSecret(secretKeyStr);
      setHasWallet(true);
      
      // Store in localStorage for persistence
      localStorage.setItem(`sodap-store-wallet-${storeId}`, JSON.stringify({
        pub: publicKeyStr,
        sec: secretKeyStr,
        pda: pdaAddress // Keep existing PDA if any
      }));
      
      // Update the store data in session storage
      updateStoreDataInSessionStorage({
        walletCreated: true,
        walletAddress: publicKeyStr
      });
      
      toast({
        title: "Store Wallet Created",
        description: `Wallet for store "${storeName}" has been generated successfully.`,
      });
    } catch (error) {
      console.error("Error generating store wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: "There was an error creating the store wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  /**
   * Create a Program Derived Address (PDA) for the store
   */
  // This duplicate function should be removed
const createStorePda2 = async () => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your admin wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!hasWallet || !walletAddress) {
      toast({
        title: "Store wallet required",
        description: "Please create or add a store wallet first",
        variant: "destructive",
      });
      return;
    }
    
    // Validate the wallet address again as a safety check
    if (!isValidSolanaPublicKey(walletAddress)) {
      toast({
        title: "Invalid wallet address",
        description: "The stored wallet address is not a valid Solana address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingPda(true);

      // Convert the storeId string to a PublicKey
      const storePublicKey = new PublicKey(walletAddress);
      
      // Generate the PDA using the store wallet address and the program ID
      const [storePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("store"), storePublicKey.toBuffer()],
        PROGRAM_ID // Use the actual program ID from our application
      );

      const pdaAddressStr = storePDA.toString();
      setPdaAddress(pdaAddressStr);
      setHasPda(true);

      // Update localStorage to include PDA
      const storedWallet = localStorage.getItem(`sodap-store-wallet-${storeId}`);
      if (storedWallet) {
        const walletData = JSON.parse(storedWallet);
        localStorage.setItem(`sodap-store-wallet-${storeId}`, JSON.stringify({
          ...walletData,
          pda: pdaAddressStr
        }));
      }
      
      // Update the store data in session storage to reflect PDA creation
      updateStoreDataInSessionStorage({
        hasPda: true,
        pdaAddress: pdaAddressStr
      });
      
      toast({
        title: "Store PDA Created",
        description: `PDA created for store: ${storeName}`,
      });
    } catch (err) {
      console.error("Error creating store PDA:", err);
      toast({
        title: "Error",
        description: "Failed to create store PDA",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPda(false);
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Store Public Key Management</CardTitle>
        <CardDescription>
          Manage wallet and program derived addresses (PDAs) for store: {storeName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="wallet">Store Wallet</TabsTrigger>
            <TabsTrigger value="pda">Program Derived Address</TabsTrigger>
          </TabsList>
          
          {/* Store Wallet Tab */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Store Wallet</CardTitle>
                <CardDescription>Create and manage the Solana wallet for this store</CardDescription>
              </CardHeader>
              <CardContent>
                {!hasWallet ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Wallet size={48} className="mb-4 text-sodap-purple" />
                    <h3 className="text-xl font-medium mb-2">No Store Wallet Found</h3>
                    <p className="text-gray-500 mb-4">Create a wallet or enter an existing wallet address</p>
                    
                    <div className="w-full max-w-md mb-6">
                      <h4 className="font-medium text-left mb-2">Enter Existing Wallet Address</h4>
                      <div className="flex flex-col gap-2 mb-1">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Enter Solana wallet address"
                            value={manualWalletAddress}
                            onChange={(e) => {
                              setManualWalletAddress(e.target.value);
                              setWalletInputError('');
                            }}
                            className={walletInputError ? 'border-red-500' : ''}
                          />
                          <Button 
                            onClick={saveManualWallet} 
                            disabled={isValidatingWallet || !manualWalletAddress.trim()}
                          >
                            {isValidatingWallet ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="p-0 h-auto text-sm text-blue-600"
                            onClick={() => setShowSecretInput(!showSecretInput)}
                          >
                            {showSecretInput ? "Hide Secret Key Input" : "+ Add Secret Key (Optional)"}
                          </Button>
                        </div>
                        
                        {showSecretInput && (
                          <div className="flex gap-2 items-center mt-1">
                            <div className="relative flex-1">
                              <Input
                                type={isManualSecretVisible ? "text" : "password"}
                                placeholder="Enter private key (optional)"
                                value={manualWalletSecret}
                                onChange={(e) => setManualWalletSecret(e.target.value)}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setIsManualSecretVisible(!isManualSecretVisible)}
                              >
                                {isManualSecretVisible ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {walletInputError && (
                          <p className="text-sm text-red-500 text-left ml-1">{walletInputError}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full max-w-md">
                      <h4 className="font-medium text-left mb-2">Create New Wallet</h4>
                      <Button 
                        onClick={generateStoreWallet} 
                        className="bg-sodap-purple hover:bg-sodap-purple/90 w-full"
                        disabled={isCreatingWallet}
                      >
                        {isCreatingWallet ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Generate New Wallet"
                        )}
                      </Button>
                    </div>
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
                    
                    {walletSecret ? (
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
                    ) : (
                      <div>
                        <p className="text-sm text-amber-600 mt-2">
                          This is a manually entered wallet address. No secret key is available.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* PDA Tab */}
          <TabsContent value="pda">
            <Card>
              <CardHeader>
                <CardTitle>Program Derived Address (PDA)</CardTitle>
                <CardDescription>Create and manage the PDA for this store</CardDescription>
              </CardHeader>
              <CardContent>
                {!hasWallet ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <KeyRound size={48} className="mb-4 text-gray-400" />
                    <h3 className="text-xl font-medium mb-2">Wallet Required</h3>
                    <p className="text-gray-500 mb-4">You need to create a store wallet first before creating a PDA</p>
                    <Button 
                      variant="outline"
                      onClick={() => document.querySelector('[data-value="wallet"]')?.dispatchEvent(new Event('click'))}
                    >
                      Go to Wallet Tab
                    </Button>
                  </div>
                ) : !hasPda ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <KeyRound size={48} className="mb-4 text-sodap-purple" />
                    <h3 className="text-xl font-medium mb-2">No PDA Found</h3>
                    <p className="text-gray-500 mb-4">Create a Program Derived Address for this store</p>
                    <Button 
                      onClick={createStorePda} 
                      className="bg-sodap-purple hover:bg-sodap-purple/90"
                      disabled={isCreatingPda || !publicKey}
                    >
                      {isCreatingPda ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create PDA"
                      )}
                    </Button>
                    {!publicKey && (
                      <p className="text-sm text-amber-600 mt-4">
                        Connect your admin wallet to create a PDA
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Program Derived Address (PDA)</h3>
                      <div className="flex items-center">
                        <Input
                          readOnly
                          value={pdaAddress}
                          className="flex-1 font-mono text-sm rounded-r-none"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-[42px] rounded-l-none border-l-0"
                          onClick={() => copyToClipboard(pdaAddress, "PDA")}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        This PDA is derived from your store wallet address and the program ID
                      </p>
                    </div>
                    <div className="border p-4 rounded-md bg-gray-50">
                      <h3 className="font-medium mb-2">What is a PDA?</h3>
                      <p className="text-sm text-gray-600">
                        Program Derived Addresses (PDAs) are special accounts that are derived 
                        deterministically from a program ID and additional seeds. They allow 
                        Solana programs to control specific addresses without needing a private key.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StoreKeyManagement;
