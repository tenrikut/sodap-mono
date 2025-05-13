
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsTab from './ProductsTab';
import RefundsTab from './RefundsTab';

type ReturnRequest = {
  id: string;
  purchaseId: string;
  date: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  storeName: string;
  transactionSignature: string;
};

type StoreManagementTabsProps = {
  defaultTab?: string;
};

const StoreManagementTabs: React.FC<StoreManagementTabsProps> = ({ defaultTab = 'products' }) => {
  // Get refund requests from session storage
  const [refundCount, setRefundCount] = useState(0);

  React.useEffect(() => {
    const storedRequests = sessionStorage.getItem('returnRequests');
    if (storedRequests) {
      const requests = JSON.parse(storedRequests);
      const pendingRequests = requests.filter((r: ReturnRequest) => r.status === 'Pending');
      setRefundCount(pendingRequests.length);
    }
  }, []);

  // Listen for storage events and custom events to update refund count
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        const pendingRequests = requests.filter((r: ReturnRequest) => r.status === 'Pending');
        setRefundCount(pendingRequests.length);
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      const requests = event.detail.requests;
      const pendingRequests = requests.filter((r: ReturnRequest) => r.status === 'Pending');
      setRefundCount(pendingRequests.length);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('returnRequestsUpdated', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('returnRequestsUpdated', handleCustomEvent as EventListener);
    };
  }, []);

  // Initial mock data for testing
  React.useEffect(() => {
    if (!sessionStorage.getItem('returnRequests')) {
      const mockRequests = [
        {
          id: '1',
          purchaseId: 'ORD-001',
          date: new Date().toISOString(),
          items: [{ name: 'SoDap T-Shirt', quantity: 1, price: 0.05 }],
          reason: 'Wrong size',
          status: 'Pending',
          storeName: 'SoDap Store',
          transactionSignature: '5KtPn3MZCPzKi8Lz7TzZNZKhqpBcWVEKhb7WQN6tGxMKqYbAoLdBw8LqXJHXqHF4k'
        },
        {
          id: '2',
          purchaseId: 'ORD-002',
          date: new Date().toISOString(),
          items: [{ name: 'SoDap Mug', quantity: 1, price: 0.02 }],
          reason: 'Damaged on arrival',
          status: 'Pending',
          storeName: 'SoDap Store',
          transactionSignature: '3JmCPzKi8Lz7TzZNZKhqpBcWVEKhb7WQN6tGxMKqYbAoLdBw8LqXJHXqHF4k5KtPn'
        }
      ];
      sessionStorage.setItem('returnRequests', JSON.stringify(mockRequests));
      setRefundCount(mockRequests.length);
    }
  }, []);

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="refunds">
          Refunds
          {refundCount > 0 && (
            <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
              {refundCount}
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
