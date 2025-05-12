import React, { useState, useEffect } from "react";
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
      walletAddress: "Gx58a8WY4FMEgvkVzMjFC8baKvnACqy1MiJxjdoLLLx8",
      hasPda: true,
      pdaAddress: "8FE27ioQh5HaM1yQwZ2aQWmCkwM8PoVyH1VnKYdN7iVD",
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
            "Gx58a8WY4FMEgvkVzMjFC8baKvnACqy1MiJxjdoLLLx8";
          watchStore.hasPda = true;
          watchStore.pdaAddress =
            "8FE27ioQh5HaM1yQwZ2aQWmCkwM8PoVyH1VnKYdN7iVD";

          // Also save this to localStorage for the admin dashboard to use
          localStorage.setItem(
            `sodap-store-wallet-5`,
            JSON.stringify({
              pub: "Gx58a8WY4FMEgvkVzMjFC8baKvnACqy1MiJxjdoLLLx8",
              sec: "58cb156e8e089675e3ba385e8b0db1853a0a7fb39d4257030be4dca2964050dd",
              pda: "8FE27ioQh5HaM1yQwZ2aQWmCkwM8PoVyH1VnKYdN7iVD",
            })
          );

          // Update the store in session storage
          const existingStores = JSON.parse(storedStores);
          const updatedStores = existingStores.map((store: Store) => {
            if (store.id === "5") {
              return {
                ...store,
                walletCreated: true,
                walletAddress: "9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J",
                hasPda: true,
                pdaAddress: "AjFmfk93LVedXVRXTdac2DWYbPYBYV6LeayyMzPU81qo",
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
            "8FE27ioQh5HaM1yQwZ2aQWmCkwM8PoVyH1VnKYdN7iVD",
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

    // Also save the wallet address and PDA if available
    if (selectedStore.walletAddress) {
      sessionStorage.setItem(
        "selectedStoreWallet",
        selectedStore.walletAddress
      );
    }

    if (selectedStore.pdaAddress) {
      sessionStorage.setItem("selectedStorePda", selectedStore.pdaAddress);
    }

    // Show toast and navigate immediately
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Select a Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <Select
                  value={searchType}
                  onValueChange={(value) =>
                    setSearchType(value as "id" | "name")
                  }
                >
                  <SelectTrigger>
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
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
                  disabled={isLoading}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mb-4">Available Stores</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStoreSelect(store.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{store.name}</h3>
                    <p className="text-sm text-gray-600">ID: {store.id}</p>
                    <p className="text-sm text-gray-600">{store.location}</p>
                    {store.walletCreated && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Wallet Ready
                      </p>
                    )}
                    {store.hasPda && (
                      <p className="text-xs text-green-600">✓ PDA Ready</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No stores found matching your search criteria. Please try again.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreSelection;
