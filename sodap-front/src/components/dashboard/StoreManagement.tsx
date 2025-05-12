
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Define schema for form validation
const storeFormSchema = z.object({
  storeName: z.string().min(2, { message: "Store name must be at least 2 characters." }),
  managerPublicKey: z.string().min(32, { message: "Manager Public Key must be valid." }),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

// Mock store data
const mockStores = [
  { id: 'store1', name: 'Fashion Boutique', managerId: 'manager1', managerName: 'Emma Wilson', walletCreated: true },
  { id: 'store2', name: 'Tech Gadgets', managerId: 'manager2', managerName: 'Michael Brown', walletCreated: false },
  { id: 'store3', name: 'Home Decor', managerId: 'manager3', managerName: 'Sophie Taylor', walletCreated: true },
  { id: 'store4', name: 'Sports Gear', managerId: 'manager4', managerName: 'James Miller', walletCreated: false },
];

const StoreManagement: React.FC = () => {
  const [stores, setStores] = useState(mockStores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<typeof mockStores[0] | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      storeName: '',
      managerPublicKey: '',
    },
  });

  const onSubmit = (values: StoreFormValues) => {
    console.log('Store form submitted:', values);
    
    if (editingStore) {
      // Edit existing store
      setStores(stores.map(store => 
        store.id === editingStore.id 
          ? { ...store, name: values.storeName, managerId: values.managerPublicKey } 
          : store
      ));
    } else {
      // Add new store
      const newStore = {
        id: `store${stores.length + 1}`,
        name: values.storeName,
        managerId: values.managerPublicKey,
        managerName: `Manager for ${values.storeName}`, // In a real app, this would come from the manager data
        walletCreated: false,
      };
      setStores([...stores, newStore]);
    }
    
    form.reset();
    setDialogOpen(false);
    setEditingStore(null);
  };

  const handleEditStore = (store: typeof mockStores[0]) => {
    setEditingStore(store);
    form.reset({
      storeName: store.name,
      managerPublicKey: store.managerId,
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = (storeId: string) => {
    setStoreToDelete(storeId);
    setAlertDialogOpen(true);
  };

  const confirmDeleteStore = () => {
    if (storeToDelete) {
      setStores(stores.filter(store => store.id !== storeToDelete));
    }
    setAlertDialogOpen(false);
    setStoreToDelete(null);
  };

  const handleCreateWallet = (storeId: string) => {
    console.log('Creating wallet for store ID:', storeId);
    // Mock creating a wallet - in real app would call an API
    setStores(stores.map(store => 
      store.id === storeId ? { ...store, walletCreated: true } : store
    ));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stores</CardTitle>
            <CardDescription>Manage all stores and their settings</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingStore(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStore ? 'Edit Store' : 'Add Store'}
                </DialogTitle>
                <DialogDescription>
                  {editingStore 
                    ? 'Update the store information below.' 
                    : 'Enter the details to create a new store.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="managerPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager Public Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter manager public key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {editingStore ? 'Update Store' : 'Create Store'}
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!store.walletCreated && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCreateWallet(store.id)}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Create Wallet
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStore(store)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteConfirm(store.id)}
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
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the store
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStore} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StoreManagement;
