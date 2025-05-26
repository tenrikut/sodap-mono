
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCards from '@/components/dashboard/StatCards';

type DefaultDashboardProps = {
  role: 'store_staff' | 'end_user';
};

const DefaultDashboard: React.FC<DefaultDashboardProps> = ({ role }) => {
  const getTitle = () => {
    switch (role) {
      case 'store_staff':
        return 'Store Staff Dashboard';
      case 'end_user':
      default:
        return 'User Dashboard';
    }
  };
  
  const getStats = () => {
    switch (role) {
      case 'store_staff':
        return [
          { title: 'Active Products', value: '64' },
          { title: 'Pending Refunds', value: '7' },
          { title: 'Daily Orders', value: '14' },
          { title: 'Weekly Sales', value: '118 SOL' },
        ];
      case 'end_user':
      default:
        return [
          { title: 'Orders', value: '12' },
          { title: 'Pending Returns', value: '1' },
          { title: 'Available SOL', value: '3.2' },
          { title: 'Total Spent', value: '24.5 SOL' },
        ];
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{getTitle()}</h1>
      
      <StatCards stats={getStats()} />

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

export default DefaultDashboard;
