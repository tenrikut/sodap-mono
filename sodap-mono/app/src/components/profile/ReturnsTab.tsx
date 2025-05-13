
import React, { useState } from 'react';
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
import { useReturnRequests } from '@/hooks/useReturnRequests';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ReturnsTab: React.FC = () => {
  const { returnRequests } = useReturnRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);
  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Return Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {returnRequests.length > 0 ? (
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
                {returnRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5">
                        {request.items.map((item, i) => (
                          <li key={i}>{item.name} x{item.quantity}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
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
    <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Request Details</DialogTitle>
        </DialogHeader>
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-gray-500">{new Date(selectedRequest.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Store</p>
                <p className="text-sm text-gray-500">{selectedRequest.storeName}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Items</p>
              <div className="space-y-2">
                {selectedRequest.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{item.price.toFixed(2)} SOL</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Return Reason</p>
              <p className="text-sm text-gray-500">{selectedRequest.reason}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {selectedRequest.status}
              </span>
            </div>

            <div className="pt-4">
              <p className="text-sm font-medium mb-1">Original Transaction</p>
              <a 
                href={`https://explorer.solana.com/tx/${selectedRequest.transactionSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline break-all"
              >
                {selectedRequest.transactionSignature}
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ReturnsTab;
