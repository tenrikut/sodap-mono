import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReturnRequest {
  id: string;
  purchaseId: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  storeName: string;
  transactionSignature: string;
}

const RefundsTab: React.FC = () => {


  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);

  // Load initial data and keep it updated
  useEffect(() => {
    const loadRequests = () => {
      try {
        const storedRequests = sessionStorage.getItem('returnRequests');
        console.log('Raw stored requests:', storedRequests);
        
        if (storedRequests) {
          const parsedRequests = JSON.parse(storedRequests);
          console.log('Found requests:', parsedRequests);
          // Only show Pending requests
          const pendingRequests = parsedRequests.filter(r => r.status === 'Pending');
          console.log('Pending requests:', pendingRequests);
          setReturnRequests(pendingRequests);
        } else {
          console.log('No stored requests found');
          setReturnRequests([]);
        }
      } catch (error) {
        console.error('Error loading requests:', error);
        setReturnRequests([]);
      }
    };

    // Load immediately
    loadRequests();

    // Set up periodic refresh
    const intervalId = setInterval(loadRequests, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Listen for updates
  useEffect(() => {
    const handleStorageChange = () => {
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (storedRequests) {
        const parsedRequests = JSON.parse(storedRequests);
        const pendingRequests = parsedRequests.filter(r => r.status === 'Pending');
        setReturnRequests(pendingRequests);
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      const requests = event.detail.requests;
      const pendingRequests = requests.filter(r => r.status === 'Pending');
      setReturnRequests(pendingRequests);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('returnRequestsUpdated', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('returnRequestsUpdated', handleCustomEvent as EventListener);
    };
  }, []);

  const handleApproveRefund = async (request: ReturnRequest) => {
    try {
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (!storedRequests) return;

      const allRequests = JSON.parse(storedRequests);
      const updatedRequests = allRequests.map(r =>
        r.id === request.id ? { ...r, status: 'Approved' as const } : r
      );
      
      sessionStorage.setItem('returnRequests', JSON.stringify(updatedRequests));
      const pendingRequests = updatedRequests.filter(r => r.status === 'Pending');
      setReturnRequests(pendingRequests);
      setSelectedRequest(null);
      toast.success('Refund approved successfully');
    } catch (error) {
      console.error('Error approving refund:', error);
      toast.error('Failed to approve refund');
    }
  };

  const handleRejectRefund = async (request: ReturnRequest) => {
    try {
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (!storedRequests) return;

      const allRequests = JSON.parse(storedRequests);
      const updatedRequests = allRequests.map(r =>
        r.id === request.id ? { ...r, status: 'Rejected' as const } : r
      );
      
      sessionStorage.setItem('returnRequests', JSON.stringify(updatedRequests));
      const pendingRequests = updatedRequests.filter(r => r.status === 'Pending');
      setReturnRequests(pendingRequests);
      setSelectedRequest(null);
      toast.success('Refund rejected successfully');
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast.error('Failed to reject refund');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pending Refund Requests</h2>
      
      <div className="text-sm text-gray-500 mb-4">
        Total pending requests: {returnRequests.length}
      </div>
      
      {returnRequests.length === 0 ? (
        <p className="text-gray-500">No pending refund requests.</p>
      ) : (
        <div className="space-y-4">
          {returnRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{request.storeName}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {new Date(request.date).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {request.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{item.price.toFixed(2)} SOL</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Return Reason</h4>
                    <p className="text-sm text-gray-500">{request.reason}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Transaction</h4>
                    <a 
                      href={`https://explorer.solana.com/tx/${request.transactionSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline break-all"
                    >
                      {request.transactionSignature}
                    </a>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleRejectRefund(request)}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveRefund(request)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogContent>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Refund Request Details</h2>
            {selectedRequest && (
              <div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Items</h4>
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
                  <h4 className="text-sm font-semibold mb-2">Return Reason</h4>
                  <p className="text-sm text-gray-500">{selectedRequest.reason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Transaction</h4>
                  <a 
                    href={`https://explorer.solana.com/tx/${selectedRequest.transactionSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline break-all"
                  >
                    {selectedRequest.transactionSignature}
                  </a>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleRejectRefund(selectedRequest)}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproveRefund(selectedRequest)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Approve Refund
                  </Button>
                </div>
              </div>
            )}
                className="bg-green-500 hover:bg-green-600"
              >
                Approve Refund
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default RefundsTab;
