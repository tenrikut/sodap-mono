import React, { useState, useEffect } from 'react';
import { WALLET_CONFIG } from '@/config/wallets';
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define store interface for type safety
interface Store {
  id: string;
  name: string;
  location: string;
  walletCreated: boolean;
  walletAddress: string | null;
  hasPda: boolean;
  pdaAddress: string | null;
}

// Get stores from session storage or use mock data as fallback
const getAvailableStores = (): Store[] => {
  // Default mock stores - ALWAYS include these basic stores
  const mockStores: Store[] = [
    {
      id: "1",
      name: "Gold Store",
      location: "Zürich, Switzerland",
      walletCreated: false,
      walletAddress: null,
      hasPda: false,
      pdaAddress: null,
    },
    {
      id: "2",
      name: "SoDap Official Store",
      location: "Munich, Germany",
      walletCreated: false,
      walletAddress: null,
      hasPda: false,
      pdaAddress: null,
    },
    {
      id: "3",
      name: "Digital Collectibles",
      location: "New York, NY",
      walletCreated: false,
      walletAddress: null,
      hasPda: false,
      pdaAddress: null,
    },
    {
      id: "4",
      name: "Crypto Merchandise",
      location: "San Francisco, CA",
      walletCreated: false,
      walletAddress: null,
      hasPda: false,
      pdaAddress: null,
    },
    {
      id: "5",
      name: "Sodap Watch Store",
      location: "Tokyo, Japan",
      walletCreated: true,
      walletAddress: "HvG8jN4UinWpd3WAnEhH56qMi9dq6w3Rg1uj3sEmQ7q7",
      hasPda: true,
      pdaAddress: "48s53bf2fe5MbhjxXquxan3W7QsNvjD5qDioJjVTPJEF",
    },
  ];

  console.log("Loading stores for store selection page...");

  // Check session storage for custom stores
  const storedStores = sessionStorage.getItem("sodap-stores");
  if (storedStores) {
    try {
      const customStores = JSON.parse(storedStores);
      // Validate custom stores
      if (Array.isArray(customStores) && customStores.length > 0) {
        // Convert to our Store type and ensure required properties
        const processedStores = customStores.map((store) => ({
          id: store.id,
          name: store.name,
          location: store.location || "Custom Store",
          // Include wallet and PDA info if available
          walletCreated: store.walletCreated || false,
          walletAddress: store.walletAddress || null,
          hasPda: store.hasPda || false,
          pdaAddress: store.pdaAddress || null,
        }));

        // Make sure Sodap Watch Store (ID: 5) is included and has a wallet
        let watchStore = processedStores.find(
          (store) =>
            store.id === "5" || store.name.toLowerCase().includes("watch")
        );

        console.log("Watch store exists in stored data:", !!watchStore);

        // If not found, add it from mock data
        if (!watchStore) {
          watchStore = mockStores.find((store) => store.id === "5");
          if (watchStore) {
            processedStores.push(watchStore);
            console.log("Added Sodap Watch Store from mock data");
          }
        }

        // Make sure the Sodap Watch Store has a wallet and PDA
        if (
          watchStore &&
          (!watchStore.walletCreated || !watchStore.walletAddress)
        ) {
          console.log("Setting up wallet for Sodap Watch Store");
          // Fixed wallet for Sodap Watch Store
          watchStore.walletCreated = true;
          watchStore.walletAddress =
            "HvG8jN4UinWpd3WAnEhH56qMi9dq6w3Rg1uj3sEmQ7q7";
          watchStore.hasPda = true;
          watchStore.pdaAddress =
            "48s53bf2fe5MbhjxXquxan3W7QsNvjD5qDioJjVTPJEF";

          // Also save this to localStorage for the admin dashboard to use
          localStorage.setItem(
            `sodap-store-wallet-5`,
            JSON.stringify({
              pub: "HvG8jN4UinWpd3WAnEhH56qMi9dq6w3Rg1uj3sEmQ7q7",
              sec: "58cb156e8e089675e3ba385e8b0db1853a0a7fb39d4257030be4dca2964050dd",
              pda: "48s53bf2fe5MbhjxXquxan3W7QsNvjD5qDioJjVTPJEF",
            })
          );

          // Update the store in session storage
          const existingStores = JSON.parse(storedStores);
          const updatedStores = existingStores.map((store: Store) => {
            if (store.id === "5") {
              return {
                ...store,
                walletCreated: true,
                walletAddress: WALLET_CONFIG.STORE_MANAGER,
                hasPda: true,
                pdaAddress: "48s53bf2fe5MbhjxXquxan3W7QsNvjD5qDioJjVTPJEF",
              };
            }
            return store;
          });

          sessionStorage.setItem("sodap-stores", JSON.stringify(updatedStores));
        }

        return processedStores;
      }
    } catch (error) {
      console.error("Error parsing stored stores:", error);
    }
  }

  // If no valid stores in session storage, return mock stores
  console.log("Using default mock stores");
  return mockStores;
};

const StoreSelection: React.FC = () => {
  const [searchType, setSearchType] = useState<"id" | "name">("name");
  const [searchValue, setSearchValue] = useState("");
  const [stores, setStores] = useState<Store[]>(getAvailableStores());
  const [filteredStores, setFilteredStores] = useState(stores);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Ensure Sodap Watch Store has a wallet and set up user Batur
  useEffect(() => {
    console.log("Available stores:", stores);
    const watchStore = stores.find((store) => store.id === "5");
    console.log("Sodap Watch Store check:", watchStore);

    // Make sure Batur's account is set up
    if (!sessionStorage.getItem("username")) {
      sessionStorage.setItem("username", "Batur");
      sessionStorage.setItem(
        "userWallet",
        "DfhzrfdE5VDk43iP1NL8MLS5xFaxquxJVFtjhjRmHLAW"
      );
      console.log("Set up Batur's wallet for payment");
    }

    // Make sure the wallet is saved to localStorage for admin dashboard
    if (watchStore && watchStore.walletAddress) {
      localStorage.setItem(
        "sodap-store-wallet-5",
        JSON.stringify({
          pub: watchStore.walletAddress,
          sec: "58cb156e8e089675e3ba385e8b0db1853a0a7fb39d4257030be4dca2964050dd", // Fake secret key
          pda:
            watchStore.pdaAddress ||
            "48s53bf2fe5MbhjxXquxan3W7QsNvjD5qDioJjVTPJEF",
        })
      );
    }
  }, [stores]);

  const handleSearch = () => {
    if (!searchValue.trim()) {
      setFilteredStores(stores);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      let results;

      if (searchType === "id") {
        results = stores.filter((store) =>
          store.id.toLowerCase().includes(searchValue.toLowerCase())
        );
      } else {
        results = stores.filter((store) =>
          store.name.toLowerCase().includes(searchValue.toLowerCase())
        );
      }

      setFilteredStores(results);
      setIsLoading(false);

      if (results.length === 0) {
        toast({
          title: "No stores found",
          description: `No stores found with that ${searchType}. Please try again.`,
        });
      }
    }, 500);
  };

  const handleStoreSelect = (storeId: string) => {
    // Get the full store object
    const selectedStore = stores.find((store) => store.id === storeId);

    if (!selectedStore) {
      toast({
        title: "Store Not Found",
        description: "The selected store could not be found.",
        variant: "destructive",
      });
      return;
    }

    // Save the selected store ID to session storage
    sessionStorage.setItem("selectedStoreId", storeId);

    // Save store wallet data to localStorage if available
    if (
      selectedStore.walletCreated &&
      selectedStore.walletAddress &&
      selectedStore.pdaAddress
    ) {
      const storeWalletData = {
        pda: selectedStore.pdaAddress,
        pub: selectedStore.walletAddress,
      };
      localStorage.setItem(
        `sodap-store-wallet-${storeId}`,
        JSON.stringify(storeWalletData)
      );
    } else {
      console.warn(`Store ${storeId} does not have wallet data configured`);
    }

    // Show success toast
    toast({
      title: "Store Selected",
      description: `You've selected ${selectedStore.name}`,
    });

    // Use a direct approach with window.location.href instead of react-router
    console.log(`Navigating to shop with store ID: ${storeId}`);

    // Use setTimeout to ensure toast is rendered before navigation
    setTimeout(() => {
      window.location.href = `/shop?store=${storeId}`;
    }, 100);
  };

  return (
    <Layout role="end_user">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sodap-purple mb-2">Welcome to SoDap</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Discover and shop from a variety of stores on the Solana blockchain. Start by selecting a store below.</p>
        </div>
        
        <Card className="mb-8 shadow-md border-0">
          <CardHeader className="bg-gradient-to-r from-sodap-purple/10 to-sodap-purple/5 pb-2">
            <CardTitle className="text-2xl font-bold">
              Find a Store
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <Select
                  value={searchType}
                  onValueChange={(value) =>
                    setSearchType(value as "id" | "name")
                  }
                >
                  <SelectTrigger className="border-sodap-purple/20">
                    <SelectValue placeholder="Search by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Store Name</SelectItem>
                    <SelectItem value="id">Store ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={
                    searchType === "id"
                      ? "Enter store ID..."
                      : "Enter store name..."
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 border-sodap-purple/20 focus-visible:ring-sodap-purple/30"
                />
                <Button
                  onClick={handleSearch}
                  variant="default"
                  className="bg-sodap-purple hover:bg-sodap-purple/90"
                  disabled={isLoading}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Featured Stores</h2>
          <div className="text-sm text-gray-500">{filteredStores.length} stores available</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden group"
              onClick={() => handleStoreSelect(store.id)}
            >
              <div className="h-2 bg-gradient-to-r from-sodap-purple to-sodap-purple/70 group-hover:h-3 transition-all"></div>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-sodap-purple transition-colors">{store.name}</h3>
                    <p className="text-sm text-gray-600">ID: {store.id}</p>
                    <p className="text-sm text-gray-600">{store.location}</p>
                    <div className="flex space-x-2 mt-2">
                      {store.walletCreated && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Wallet Ready
                        </span>
                      )}
                      {store.hasPda && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ PDA Ready
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-sodap-purple hover:bg-sodap-purple/90 mt-2 group-hover:translate-y-0 translate-y-1 transition-transform"
                  >
                    Shop Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No stores found matching your search criteria.</p>
            <p className="text-sm mt-1">Please try a different search term or browse our featured stores.</p>
            <Button 
              variant="outline" 
              className="mt-4 border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
              onClick={() => {
                setSearchValue('');
                setFilteredStores(stores);
              }}
            >
              View All Stores
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreSelection;
