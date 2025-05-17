
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UserPlus, UserMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define schema for form validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

// Mock data for admins
const mockAdmins = [
  { id: '1', name: 'Jane Smith', email: 'jane@sodap.io', createdAt: '2025-04-01T12:00:00Z' },
  { id: '2', name: 'John Doe', email: 'john@sodap.io', createdAt: '2025-04-02T14:30:00Z' },
  { id: '3', name: 'Alice Johnson', email: 'alice@sodap.io', createdAt: '2025-04-03T09:15:00Z' },
];

const PlatformAdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState(mockAdmins);
  const [open, setOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const onSubmit = (values: FormValues) => {
    console.log('Adding platform admin:', values);
    // Mock adding a platform admin - in real app would call an API
    const newAdmin = {
      id: (admins.length + 1).toString(),
      name: values.name,
      email: values.email,
      createdAt: new Date().toISOString(),
    };
    setAdmins([...admins, newAdmin]);
    form.reset();
    setOpen(false);
  };

  const handleRemoveAdmin = (adminId: string) => {
    console.log('Removing admin with ID:', adminId);
    // Mock removing an admin - in real app would call an API
    setAdmins(admins.filter(admin => admin.id !== adminId));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Platform Admins</CardTitle>
          <CardDescription>Manage platform administrators</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Platform Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Platform Admin</DialogTitle>
              <DialogDescription>
                Create a new platform administrator account.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SoDap Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="name@sodap.io" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Platform Admin</Button>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{formatDate(admin.createdAt)}</TableCell>
                <TableCell>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRemoveAdmin(admin.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PlatformAdminManagement;
