
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Package } from 'lucide-react';

type ProductType = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  active: boolean;
};

type ProductsTabProps = {
  initialProducts?: ProductType[];
  customTitle?: string;
};

const ProductsTab: React.FC<ProductsTabProps> = ({ 
  initialProducts = [
    { id: '1', name: 'SoDap T-Shirt', sku: 'TS001', price: 0.05, stock: 100, active: true },
    { id: '2', name: 'SoDap Mug', sku: 'MG001', price: 0.02, stock: 50, active: true },
    { id: '3', name: 'SoDap Sticker Pack', sku: 'ST001', price: 0.01, stock: 200, active: true },
    { id: '4', name: 'SoDap Cap', sku: 'CP001', price: 0.03, stock: 75, active: false },
  ],
  customTitle
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleProductStatus = (id: string) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, active: !product.active } : product
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{customTitle || "Product Inventory"}</CardTitle>
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
  );
};

export default ProductsTab;
