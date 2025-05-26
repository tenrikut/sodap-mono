import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Wallet,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StorePDAManager } from "@/components/admin/StorePDAManager";
import { useToast } from "@/hooks/use-toast";

// Define schema for form validation
const storeFormSchema = z.object({
  storeName: z
    .string()
    .min(2, { message: "Store name must be at least 2 characters." }),
  storeDescription: z.string().optional(), // Optional store description
  managerName: z.string().optional(), // Optional manager name
  managerPublicKey: z.string().optional(), // Make public key optional
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

// Define the Store interface to include all properties
interface Store {
  id: string;
  name: string;
  description: string;
  managerId: string;
  managerName: string;
  walletCreated: boolean;
  walletAddress: string;
  hasPda: boolean;
  pdaAddress: string;
  revenue: string;
  products: number;
  customers: number;
  location: string;
}

// Default mock store data with PDA status
const defaultMockStores = [
  {
    id: "1",
    name: "SoDap Official Store",
    description: "The official store for SoDap merchandise",
    managerId: "admin",
    managerName: "John Smith",
    revenue: "$12,500",
    products: 15,
    customers: 120,
    walletCreated: false,
    walletAddress: "",
    hasPda: false,
    pdaAddress: "",
    location: "New Location",
  },
  {
    id: "2",
    name: "Digital Collectibles",
    description: "Rare digital collectibles and NFTs",
    managerId: "admin",
    managerName: "Alice Johnson",
    revenue: "$8,200",
    products: 48,
    customers: 93,
    walletCreated: false,
    walletAddress: "",
    hasPda: false,
    pdaAddress: "",
    location: "New Location",
  },
  {
    id: "3",
    name: "Crypto Merchandise",
    description: "T-shirts, mugs, and more featuring cryptocurrency logos",
    managerId: "admin",
    managerName: "Bob Williams",
    revenue: "$5,400",
    products: 32,
    customers: 76,
    walletCreated: false,
    walletAddress: "",
    hasPda: false,
    pdaAddress: "",
    location: "New Location",
  },
  {
    id: "4",
    name: "Blockchain Apparel",
    description: "Clothing and accessories for blockchain enthusiasts",
    managerId: "admin",
    managerName: "Eva Martinez",
    revenue: "$7,800",
    products: 27,
    customers: 65,
    walletCreated: false,
    walletAddress: "",
    hasPda: false,
    pdaAddress: "",
    location: "New Location",
  },
  {
    id: "5",
    name: "Sodap Watch Store",
    description: "Luxury watches for blockchain enthusiasts",
    managerId: "admin",
    managerName: "Takashi Yamamoto",
    revenue: "$15,300",
    products: 12,
    customers: 45,
    walletCreated: true,
    walletAddress: "HvG8jN4UinWpd3WAnEhH56qMi9dq6w3Rg1uj3sEmQ7q7",
    hasPda: true,
    pdaAddress: "48s53bf2fe5MbhjxXquxan3W7QsNvjD5qDioJjVTPJEF",
    location: "Tokyo, Japan",
  },
];

// Helper function to get stores from session storage or use defaults
const getInitialStores = (): Store[] => {
  const storedStores = sessionStorage.getItem("sodap-stores");
  if (storedStores) {
    try {
      return JSON.parse(storedStores);
    } catch (error) {
      console.error("Error parsing stored stores:", error);
    }
  }
  return defaultMockStores;
};

const StoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>(getInitialStores());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  // Save stores to session storage whenever they change
  useEffect(() => {
    sessionStorage.setItem("sodap-stores", JSON.stringify(stores));
  }, [stores]);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
      managerName: "",
      managerPublicKey: "",
    },
  });

  const onSubmit = (values: StoreFormValues) => {
    if (editingStore) {
      // Edit existing store
      const updatedStores = stores.map((store) =>
        store.id === editingStore.id
          ? {
              ...store,
              name: values.storeName,
              description: values.storeDescription || store.description || "",
              managerName: values.managerName || store.managerName,
              managerId: values.managerPublicKey || "", // Handle case where public key is not provided
            }
          : store
      );
      setStores(updatedStores);

      // Update session storage
      sessionStorage.setItem("sodap-stores", JSON.stringify(updatedStores));

      setDialogOpen(false);
      form.reset();
      setEditingStore(null);

      toast({
        title: "Store Updated",
        description: `Store "${values.storeName}" has been updated successfully.`,
      });
    } else {
      // Check if we're trying to add a store with name 'Sodap Watch Store'
      let storeId;
      const storeName = values.storeName;

      if (
        storeName.toLowerCase() === "sodap watch store" ||
        storeName.toLowerCase() === "sodap watch"
      ) {
        storeId = "5";
        // Check if store with ID 5 already exists
        const existingStore = stores.find((s) => s.id === "5");
        if (existingStore) {
          toast({
            title: "Store Already Exists",
            description: `A store with name Sodap Watch Store already exists.`,
            variant: "destructive",
          });
          return;
        }
      } else {
        // Generate a unique store ID that's not already in use
        let counter = stores.length + 1;
        storeId = `store${counter}`;

        // Keep incrementing counter until we find an unused ID
        while (stores.some((store) => store.id === storeId)) {
          counter++;
          storeId = `store${counter}`;
        }
      }

      // Create a new store object
      const newStore: Store = {
        id: storeId,
        name: values.storeName,
        description: values.storeDescription || "",
        managerId: "admin", // In a real app, this would be the current user's ID
        managerName: values.managerName || "",
        revenue: "$0",
        products: 0,
        customers: 0,
        location: values.storeName.toLowerCase().includes("watch")
          ? "Tokyo, Japan"
          : "New Location",
        walletCreated: false,
        walletAddress: values.managerPublicKey || "",
        hasPda: false,
        pdaAddress: "",
      };

      // Add new store to state
      const updatedStores = [...stores, newStore];
      setStores(updatedStores);

      // Update session storage
      sessionStorage.setItem("sodap-stores", JSON.stringify(updatedStores));

      setDialogOpen(false);
      form.reset();

      toast({
        title: "Store Created",
        description: `Store "${values.storeName}" has been created successfully.`,
      });
    }

    form.reset();
    setDialogOpen(false);
    setEditingStore(null);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    form.reset({
      storeName: store.name,
      storeDescription: store.description || "",
      managerName: store.managerName || "",
      managerPublicKey: store.managerId,
    });
    setDialogOpen(true);
  };

  const handleDeleteStore = (store: Store) => {
    setStoreToDelete(store);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteStore = () => {
    if (storeToDelete) {
      const updatedStores = stores.filter(
        (store) => store.id !== storeToDelete.id
      );
      setStores(updatedStores);

      // Update session storage
      sessionStorage.setItem("sodap-stores", JSON.stringify(updatedStores));

      setStoreToDelete(null);
      setDeleteConfirmOpen(false);

      toast({
        title: "Store Deleted",
        description: `The store ${storeToDelete.name} has been deleted successfully.`,
      });
    }
  };

  const handleCreateWallet = (storeId: string) => {
    console.log("Creating wallet for store ID:", storeId);
    // Mock creating a wallet - in real app would call an API
    const updatedStores = stores.map((store) =>
      store.id === storeId
        ? {
            ...store,
            walletCreated: true,
            walletAddress: generateMockWalletAddress(),
          }
        : store
    );

    // Update state
    setStores(updatedStores);

    // Update session storage
    sessionStorage.setItem("sodap-stores", JSON.stringify(updatedStores));

    const storeName = stores.find((s) => s.id === storeId)?.name || "Unknown";
    toast({
      title: "Wallet Created",
      description: `Wallet for store "${storeName}" has been created.`,
    });
  };

  // Helper to generate a mock Solana wallet address
  const generateMockWalletAddress = () => {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle PDA creation
  const handlePdaCreated = (storeId: string, pdaAddress: string) => {
    console.log("PDA created for store ID:", storeId, "Address:", pdaAddress);
    const updatedStores = stores.map((store) =>
      store.id === storeId
        ? {
            ...store,
            hasPda: true,
            pdaAddress: pdaAddress,
          }
        : store
    );

    // Update state
    setStores(updatedStores);

    // Update session storage
    sessionStorage.setItem("sodap-stores", JSON.stringify(updatedStores));

    const storeName = stores.find((s) => s.id === storeId)?.name || "Unknown";
    toast({
      title: "PDA Created",
      description: `PDA for store "${storeName}" has been created.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stores</CardTitle>
            <CardDescription>
              Manage all stores and their settings
            </CardDescription>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingStore(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStore ? "Edit Store" : "Add Store"}
                </DialogTitle>
                <DialogDescription>
                  {editingStore
                    ? "Update the store information below."
                    : "Enter the details to create a new store."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter store name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Store Description{" "}
                          <span className="text-gray-500 text-sm">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter store description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="managerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Store Manager Name{" "}
                          <span className="text-gray-500 text-sm">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter store manager name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="managerPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Manager Public Key{" "}
                          <span className="text-gray-500 text-sm">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter manager's public key or leave empty"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500 mt-1">
                          You can create a wallet later using the Manage Keys
                          button
                        </p>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {editingStore ? "Update Store" : "Create Store"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Store ID</TableHead>
                <TableHead>Store Manager</TableHead>
                <TableHead className="text-center">Wallet Created</TableHead>
                <TableHead className="text-center">PDA Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.id}</TableCell>
                  <TableCell>{store.managerName}</TableCell>
                  <TableCell className="text-center">
                    {store.walletCreated ? (
                      <span className="inline-flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600">
                        <X className="h-4 w-4 mr-1" />
                        No
                      </span>
                    )}
                    {store.walletAddress && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500 break-all">
                          {store.walletAddress.substring(0, 8)}...
                          {store.walletAddress.substring(
                            store.walletAddress.length - 8
                          )}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {store.hasPda ? (
                      <span className="inline-flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600">
                        <X className="h-4 w-4 mr-1" />
                        No
                      </span>
                    )}
                    {store.pdaAddress && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500 break-all">
                          {store.pdaAddress.substring(0, 8)}...
                          {store.pdaAddress.substring(
                            store.pdaAddress.length - 8
                          )}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Manage Keys button */}
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-sodap-purple hover:bg-purple-700"
                        onClick={() => navigate(`/store/${store.id}`)}
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        Manage Keys
                      </Button>
                      {/* Edit button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStore(store)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStore(store)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              store and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStore}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StoreManagement;
