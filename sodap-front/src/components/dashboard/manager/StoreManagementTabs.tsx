
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsTab from './ProductsTab';
import RefundsTab from './RefundsTab';

type StoreManagementTabsProps = {
  defaultTab?: string;
};

const StoreManagementTabs: React.FC<StoreManagementTabsProps> = ({ defaultTab = 'products' }) => {
  // Mock data for refund requests, this would typically come from props or API
  const [refunds] = useState([
    { id: '1', orderId: 'ORD-001', user: 'alice@example.com', items: 'SoDap T-Shirt', amount: 0.05, status: 'pending' },
    { id: '2', orderId: 'ORD-002', user: 'bob@example.com', items: 'SoDap Mug', amount: 0.02, status: 'pending' },
  ]);

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="refunds">
          Refunds
          {refunds.length > 0 && (
            <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
              {refunds.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="products">
        <ProductsTab />
      </TabsContent>
      
      <TabsContent value="refunds">
        <RefundsTab />
      </TabsContent>
    </Tabs>
  );
};

export default StoreManagementTabs;
