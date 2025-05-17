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

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full">
            <h2 className="text-xl font-semibold mb-4">Refund Requests</h2>
            <RefundsTab />
          </div>
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

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
    </div>
  );
}
