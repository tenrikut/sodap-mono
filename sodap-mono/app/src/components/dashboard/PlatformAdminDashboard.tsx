
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PlatformAdminManagement from '@/components/dashboard/PlatformAdminManagement';
import StoreManagement from '@/components/dashboard/StoreManagement';
import StatCards from '@/components/dashboard/StatCards';

type PlatformAdminStats = {
  title: string;
  value: string;
}[];

const PlatformAdminDashboard: React.FC = () => {
  const stats: PlatformAdminStats = [
    { title: 'Platform Admins', value: '12' },
    { title: 'Store Managers', value: '36' },
    { title: 'Active Stores', value: '145' },
    { title: 'Monthly Sales', value: '9,842 SOL' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Overview</h1>
      
      <StatCards stats={stats} />

      <PlatformAdminManagement />
      <StoreManagement />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Activity data will be populated here from the Solana blockchain</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAdminDashboard;
