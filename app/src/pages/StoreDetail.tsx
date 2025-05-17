import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import BackButton from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, ShoppingBag, KeyRound, Bell } from "lucide-react";
import StoreKeyManagement from "@/components/admin/StoreKeyManagement";
import { useToast } from "@/hooks/use-toast";

// Mock store data for demonstration
const mockStores = [
  {
    id: "store1",
    name: "Fashion Boutique",
    description: "High quality fashion items for all seasons",
    managerId: "manager1",
    managerName: "Emma Wilson",
    revenue: "12,450 SOL",
    products: 64,
    customers: 358,
  },
  {
    id: "store2",
    name: "Tech Gadgets",
    description: "Latest tech gadgets and accessories",
    managerId: "manager2",
    managerName: "Michael Brown",
    revenue: "28,932 SOL",
    products: 128,
    customers: 751,
  },
  {
    id: "store3",
    name: "Home Decor",
    description: "Beautiful decor items for your home",
    managerId: "manager3",
    managerName: "Sophie Taylor",
    revenue: "9,213 SOL",
    products: 79,
    customers: 243,
  },
  {
    id: "store4",
    name: "Sports Gear",
    description: "Quality sports equipment for all activities",
    managerId: "manager4",
    managerName: "James Miller",
    revenue: "15,876 SOL",
    products: 93,
    customers: 412,
  },
];

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

const StoreDetail: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<StoreData | null>(null);

  useEffect(() => {
    // Set up a fake user session for demo purposes
    if (!sessionStorage.getItem("username")) {
      sessionStorage.setItem("username", "admin");
      sessionStorage.setItem("userRole", "platform_admin");
    }

    // Get stores from session storage
    const storedStores = sessionStorage.getItem("sodap-stores");
    let availableStores = mockStores; // Default to mock stores if none in session

    if (storedStores) {
      try {
        availableStores = JSON.parse(storedStores);
      } catch (error) {
        console.error("Error parsing stored stores:", error);
      }
    }

    // Find the selected store
    const selectedStore = availableStores.find((s) => s.id === storeId);

    if (selectedStore) {
      setStore(selectedStore);
      console.log("Found store:", selectedStore);
    } else {
      console.error(
        "Store not found. ID:",
        storeId,
        "Available stores:",
        availableStores
      );
      toast({
        title: "Store Not Found",
        description: `The store with ID ${storeId} could not be found.`,
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [storeId, navigate, toast]);

  if (!store) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>Loading store information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="platform_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BackButton />
            <h1 className="text-3xl font-bold">{store.name}</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Store Overview</CardTitle>
            <CardDescription>{store.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col p-4 bg-gray-50 rounded-md">
                <p className="text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{store.revenue}</p>
              </div>
              <div className="flex flex-col p-4 bg-gray-50 rounded-md">
                <p className="text-gray-500">Products</p>
                <p className="text-2xl font-bold">{store.products}</p>
              </div>
              <div className="flex flex-col p-4 bg-gray-50 rounded-md">
                <p className="text-gray-500">Customers</p>
                <p className="text-2xl font-bold">{store.customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="keys">
              <KeyRound className="mr-2 h-4 w-4" />
              Public Keys
            </TabsTrigger>
            <TabsTrigger value="products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <StoreKeyManagement storeId={store.id} storeName={store.name} />
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>
                  Manage products for this store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Product management functionality will be implemented in a
                  future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>
                  Configure settings for this store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Store settings will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage store notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Notification management will be implemented in a future
                  update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StoreDetail;
