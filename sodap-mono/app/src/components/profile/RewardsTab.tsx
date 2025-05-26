
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Mock purchase history
const mockPurchaseHistory = [
  {
    id: "pur_123456",
    date: "2025-05-08",
    store: "Electronics Emporium",
    items: ["Wireless Earbuds", "Phone Charger"],
    total: "1.45 SOL",
  },
  {
    id: "pur_123457",
    date: "2025-05-01",
    store: "Digital Decor",
    items: ["Smart Light Bulb"],
    total: "0.75 SOL",
  },
  {
    id: "pur_123458",
    date: "2025-04-22",
    store: "Fashion Forward",
    items: ["T-Shirt", "Jeans", "Hat"],
    total: "2.30 SOL",
  },
];

const RewardsTab: React.FC = () => {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase History</CardTitle>
        <p className="text-gray-500">View your recent purchases</p>
      </CardHeader>
      <CardContent className="space-y-6">

        <div>
          <h3 className="font-medium mb-4">Recent Purchases</h3>
          {mockPurchaseHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseHistory.slice(0, 3).map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.date}</TableCell>
                    <TableCell>{purchase.store}</TableCell>
                    <TableCell>
                      {purchase.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">No rewards earned yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsTab;
