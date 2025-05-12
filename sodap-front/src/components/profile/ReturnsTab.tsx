
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

// Mock return requests
const mockReturnRequests = [
  {
    id: "ret_789012",
    purchaseId: "pur_123456",
    date: "2025-05-09",
    item: "Wireless Earbuds",
    reason: "Defective",
    status: "Pending",
  },
];

const ReturnsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Return Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {mockReturnRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReturnRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>{request.item}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No return requests yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReturnsTab;
