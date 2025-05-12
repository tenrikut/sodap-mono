
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type RefundType = {
  id: string;
  orderId: string;
  user: string;
  items: string;
  amount: number;
  status: string;
};

type RefundsTabProps = {
  initialRefunds?: RefundType[];
};

const RefundsTab: React.FC<RefundsTabProps> = ({ 
  initialRefunds = [
    { id: '1', orderId: 'ORD-001', user: 'alice@example.com', items: 'SoDap T-Shirt', amount: 0.05, status: 'pending' },
    { id: '2', orderId: 'ORD-002', user: 'bob@example.com', items: 'SoDap Mug', amount: 0.02, status: 'pending' },
  ]
}) => {
  const [refunds, setRefunds] = useState(initialRefunds);

  const handleApproveRefund = (id: string) => {
    // In a real app, this would call the refund_from_escrow instruction
    setRefunds(refunds.filter(refund => refund.id !== id));
    alert(`Refund ${id} approved! In a real app, this would trigger the on-chain refund.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Refund Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {refunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Order ID</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Items</th>
                  <th className="text-left py-2">Amount (SOL)</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b">
                    <td className="py-3">{refund.orderId}</td>
                    <td className="py-3">{refund.user}</td>
                    <td className="py-3">{refund.items}</td>
                    <td className="py-3">{refund.amount} SOL</td>
                    <td className="py-3 text-right">
                      <Button 
                        onClick={() => handleApproveRefund(refund.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Approve Refund
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-6 text-gray-500">No pending refund requests.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RefundsTab;
