
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsTab from './ProductsTab';



type StoreManagementTabsProps = {
  defaultTab?: string;
};

const StoreManagementTabs: React.FC<StoreManagementTabsProps> = ({ defaultTab = 'products' }) => {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="products">Products</TabsTrigger>
      </TabsList>
      
      <TabsContent value="products">
        <ProductsTab />
      </TabsContent>
    </Tabs>
  );
};

export default StoreManagementTabs;
