import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Package, Edit, Trash } from 'lucide-react';
import BackButton from '@/components/ui/back-button';

// Mock data for products
const mockProducts = [
  { id: '1', name: 'SoDap T-Shirt', sku: 'TS001', price: 0.05, stock: 100, active: true },
  { id: '2', name: 'SoDap Mug', sku: 'MG001', price: 0.02, stock: 50, active: true },
  { id: '3', name: 'SoDap Sticker Pack', sku: 'ST001', price: 0.01, stock: 200, active: true },
  { id: '4', name: 'SoDap Cap', sku: 'CP001', price: 0.03, stock: 75, active: false },
];

// Mock data for refund requests
const mockRefunds = [
  { id: '1', orderId: 'ORD-001', user: 'alice@example.com', items: 'SoDap T-Shirt', amount: 0.05, status: 'pending' },
  { id: '2', orderId: 'ORD-002', user: 'bob@example.com', items: 'SoDap Mug', amount: 0.02, status: 'pending' },
];

const Store: React.FC = () => {
  const [products, setProducts] = useState(mockProducts);
  const [refunds, setRefunds] = useState(mockRefunds);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApproveRefund = (id: string) => {
    // In a real app, this would call the refund_from_escrow instruction
    setRefunds(refunds.filter(refund => refund.id !== id));
    alert(`Refund ${id} approved! In a real app, this would trigger the on-chain refund.`);
  };

  const handleToggleProductStatus = (id: string) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, active: !product.active } : product
    ));
  };

  const pendingRefundsCount = refunds.filter(r => r.status === 'pending').length;

  return (
    <Layout role="store_manager">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">Store Dashboard</h1>
        </div>
        
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="refunds">
              Refunds
              {pendingRefundsCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {pendingRefundsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Inventory</CardTitle>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search by name or SKU..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button className="bg-sodap-purple hover:bg-purple-700">
                    <Package className="mr-2 h-4 w-4" /> Import CSV
                  </Button>
                  <Button className="bg-sodap-purple hover:bg-purple-700">
                    + Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">SKU</th>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Price (SOL)</th>
                        <th className="text-left py-2">Stock</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="py-3">{product.sku}</td>
                          <td className="py-3">{product.name}</td>
                          <td className="py-3">{product.price} SOL</td>
                          <td className="py-3">{product.stock}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {product.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleProductStatus(product.id)}
                              className={product.active ? 'text-red-500' : 'text-green-500'}
                            >
                              {product.active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="refunds">
            <Card>
              <CardHeader>
                <CardTitle>Pending Refund Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {refunds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Order ID</th>
                          <th className="text-left py-2">User</th>
                          <th className="text-left py-2">Items</th>
                          <th className="text-left py-2">Amount (SOL)</th>
                          <th className="text-right py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refunds.map((refund) => (
                          <tr key={refund.id} className="border-b">
                            <td className="py-3">{refund.orderId}</td>
                            <td className="py-3">{refund.user}</td>
                            <td className="py-3">{refund.items}</td>
                            <td className="py-3">{refund.amount} SOL</td>
                            <td className="py-3 text-right">
                              <Button 
                                onClick={() => handleApproveRefund(refund.id)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                Approve Refund
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-500">No pending refund requests.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Store;
