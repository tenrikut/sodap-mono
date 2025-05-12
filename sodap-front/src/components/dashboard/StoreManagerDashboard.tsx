
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCards from '@/components/dashboard/StatCards';
import { Package, FileText, Users, TrendingUp } from 'lucide-react';
import OverviewTab from './manager/OverviewTab';
import ProductsTab from './manager/ProductsTab';
import StoreManagementTabs from './manager/StoreManagementTabs';
import StaffManagement from '@/components/dashboard/StaffManagement';
import RecentActivity from './manager/RecentActivity';

type StoreManagerDashboardProps = {
  initialTab?: 'overview' | 'store' | 'staff' | 'refunds' | 'products';
  customTabTitle?: string;
};

const StoreManagerDashboard: React.FC<StoreManagerDashboardProps> = ({ 
  initialTab = 'overview',
  customTabTitle
}) => {
  const stats = [
    { title: 'Active Products', value: '64', icon: <Package className="h-4 w-4 text-blue-500" /> },
    { title: 'Pending Refunds', value: '7', icon: <FileText className="h-4 w-4 text-amber-500" /> },
    { title: 'Staff Members', value: '5', icon: <Users className="h-4 w-4 text-green-500" /> },
    { title: 'Monthly Sales', value: '423 SOL', icon: <TrendingUp className="h-4 w-4 text-purple-500" /> },
  ];
  
  // Set the default tab based on initialTab prop
  let defaultTab = initialTab;
  let defaultStoreTab = 'products';
  
  // Special handling for refunds and products tabs
  if (initialTab === 'refunds') {
    defaultTab = 'store';
    defaultStoreTab = 'refunds';
  } else if (initialTab === 'products') {
    defaultTab = 'products';
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Store Overview</h1>
      
      <StatCards stats={stats} />
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Store Overview</TabsTrigger>
          <TabsTrigger value="products">{customTabTitle || "Products"}</TabsTrigger>
          <TabsTrigger value="store">Store Management</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductsTab customTitle={customTabTitle} />
        </TabsContent>
        
        <TabsContent value="store">
          <StoreManagementTabs defaultTab={defaultStoreTab} />
        </TabsContent>
        
        <TabsContent value="staff">
          <StaffManagement />
        </TabsContent>
      </Tabs>

      <RecentActivity />
    </div>
  );
};

export default StoreManagerDashboard;
