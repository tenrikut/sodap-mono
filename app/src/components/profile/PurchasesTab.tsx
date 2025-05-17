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
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { useReturnRequests } from '@/hooks/useReturnRequests';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Purchase {
  id: string;
  storeName: string;
  date: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalAmount: number;
  transactionSignature: string;
  isReturned?: boolean;
}

interface ReceiptDetailsProps {
  transactionSignature: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalAmount: number;
  date: string;
  storeName: string;
}

interface ReceiptDetailsProps extends Purchase {
  onReturn: () => void;
  isReturned?: boolean;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({ 
  transactionSignature, 
  items, 
  totalAmount, 
  date, 
  storeName,
  onReturn,
  isReturned
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium">Date</p>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
      <div>
        <p className="text-sm font-medium">Store</p>
        <p className="text-sm text-gray-500">{storeName}</p>
      </div>
    </div>

    <div>
      <p className="text-sm font-medium mb-2">Items</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{item.name} x{item.quantity}</span>
            <span>{item.price.toFixed(2)} SOL</span>
          </div>
        ))}
      </div>
    </div>

    <div className="border-t pt-4">
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{totalAmount.toFixed(2)} SOL</span>
      </div>
    </div>

    <div className="pt-4">
      <p className="text-sm font-medium mb-1">Transaction Details</p>
      <a 
        href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:underline break-all"
      >
        {transactionSignature}
      </a>
    </div>

    <div className="pt-4 flex justify-end">
      {!isReturned ? (
        <Button
          variant="secondary"
          onClick={onReturn}
        >
          Return Items
        </Button>
      ) : (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
          Return Requested
        </span>
      )}
    </div>
  </div>
);

const PurchasesTab: React.FC = () => {
  const { purchases, isLoading, error } = usePurchaseHistory();
  const { createReturnRequest } = useReturnRequests();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-red-500">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Purchase Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length > 0 ? (
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
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id} className={purchase.isReturned ? 'bg-gray-50' : ''}>
                      <TableCell>{purchase.date}</TableCell>
                      <TableCell>{purchase.storeName}</TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5">
                          {purchase.items.map((item, i) => (
                            <li key={i}>{item.name} x{item.quantity}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{purchase.totalAmount.toFixed(2)} SOL</span>
                          {purchase.isReturned && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Return Requested
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedPurchase(purchase)}
                        >
                          View Receipt
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

      <Dialog open={!!selectedPurchase} onOpenChange={() => {
        setSelectedPurchase(null);
        setShowReturnDialog(false);
        setReturnReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          {selectedPurchase && !showReturnDialog && (
            <ReceiptDetails 
              {...selectedPurchase} 
              onReturn={() => setShowReturnDialog(true)} 
            />
          )}
          {showReturnDialog && selectedPurchase && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Return Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you want to return these items"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowReturnDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!returnReason.trim()) {
                      toast.error('Please provide a reason for return');
                      return;
                    }
                    await createReturnRequest(selectedPurchase, returnReason);
                    setSelectedPurchase(null);
                    setShowReturnDialog(false);
                    setReturnReason('');
                  }}
                >
                  Submit Return Request
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PurchasesTab;
