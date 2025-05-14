import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletConnect } from '@/components/dashboard/manager/WalletConnect';
import RefundsTab from '@/components/dashboard/manager/RefundsTab';
import { useStoreManager } from '@/hooks/useStoreManager';

export default function ManagerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isManagerEmail } = useStoreManager();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !isManagerEmail) {
      router.push('/');
    }
  }, [session, status, router, isManagerEmail]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || !isManagerEmail) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Store Manager Dashboard</h1>
      </div>

      <WalletConnect />

      <Tabs defaultValue="refunds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="refunds" className="space-y-4">
          <RefundsTab />
        </TabsContent>

        <TabsContent value="orders">
          <div className="text-center text-gray-500 py-8">
            Orders management coming soon
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="text-center text-gray-500 py-8">
            Product management coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
