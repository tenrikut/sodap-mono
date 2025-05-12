
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const PurchasesTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Receipts </CardTitle>
      </CardHeader>
      <CardContent>
        {mockPurchaseHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseHistory.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.date}</TableCell>
                    <TableCell>{purchase.store}</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5">
                        {purchase.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>{purchase.total}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Receipts Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No purchases yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchasesTab;
