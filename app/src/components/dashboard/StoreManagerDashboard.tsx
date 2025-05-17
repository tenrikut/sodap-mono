
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCards from '@/components/dashboard/StatCards';
import { Package, FileText, Users, TrendingUp } from 'lucide-react';
import OverviewTab from './manager/OverviewTab';
import ProductsTab from './manager/ProductsTab';
import StoreManagementTabs from './manager/StoreManagementTabs';
import StaffManagement from '@/components/dashboard/StaffManagement';
import RecentActivity from './manager/RecentActivity';
import RefundsTab from './manager/RefundsTab';

type StoreManagerDashboardProps = {
  initialTab?: 'overview' | 'store' | 'staff' | 'refunds' | 'products';
  customTabTitle?: string;
};

const StoreManagerDashboard: React.FC<StoreManagerDashboardProps> = ({ 
  initialTab = 'overview',
  customTabTitle
}) => {

  
  const [refundCount, setRefundCount] = useState(0);

  // Get refund count from session storage
  useEffect(() => {
    const storedRequests = sessionStorage.getItem('returnRequests');
    if (storedRequests) {
      const requests = JSON.parse(storedRequests);
      const pendingRequests = requests.filter((r: { status: string }) => r.status === 'Pending');
      setRefundCount(pendingRequests.length);
    }
  }, []);

  // Listen for storage events and custom events to update refund count
  useEffect(() => {
    const handleStorageChange = () => {
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        const pendingRequests = requests.filter((r: { status: string }) => r.status === 'Pending');
        setRefundCount(pendingRequests.length);
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      const requests = event.detail.requests;
      const pendingRequests = requests.filter((r: { status: string }) => r.status === 'Pending');
      setRefundCount(pendingRequests.length);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('returnRequestsUpdated', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('returnRequestsUpdated', handleCustomEvent as EventListener);
    };
  }, []);

  // Update stats with real refund count
  const stats = [
    { title: 'Active Products', value: '64', icon: <Package className="h-4 w-4 text-blue-500" /> },
    { title: 'Pending Refunds', value: refundCount.toString(), icon: <FileText className="h-4 w-4 text-amber-500" /> },
    { title: 'Staff Members', value: '5', icon: <Users className="h-4 w-4 text-green-500" /> },
    { title: 'Monthly Sales', value: '423 SOL', icon: <TrendingUp className="h-4 w-4 text-purple-500" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Store Overview</h1>
      
      <StatCards stats={stats} />
      
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Store Overview</TabsTrigger>
          <TabsTrigger value="products">{customTabTitle || "Products"}</TabsTrigger>
          <TabsTrigger value="store">Store Management</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="refunds">
            Refunds
            {refundCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {refundCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductsTab customTitle={customTabTitle} />
        </TabsContent>
        
        <TabsContent value="store">
          <StoreManagementTabs defaultTab="products" />
        </TabsContent>
        
        <TabsContent value="staff">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="refunds">
          <RefundsTab />
        </TabsContent>
      </Tabs>

      <RecentActivity />
    </div>
  );
};

export default StoreManagerDashboard;
