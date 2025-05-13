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
  const [open, setOpen] = useState(false);

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
      setOpen(false);
      toast.success('Refund approved successfully');
      window.dispatchEvent(new CustomEvent('refundRequestUpdate'));
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
      setOpen(false);
      toast.success('Refund rejected successfully');
      window.dispatchEvent(new CustomEvent('refundRequestUpdate'));
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast.error('Failed to reject refund');
    }
  };

  // Load initial data and keep it updated
  useEffect(() => {
    console.log('RefundsTab: Setting up effect');
    const loadRequests = () => {
      console.log('RefundsTab: Loading requests...');
      try {
        const storedRequests = sessionStorage.getItem('returnRequests');
        console.log('Raw stored requests:', storedRequests);
        
        if (storedRequests) {
          const parsedRequests = JSON.parse(storedRequests);
          console.log('Found requests:', parsedRequests);
          setReturnRequests(parsedRequests);
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
    console.log('RefundsTab: Initial load');
    loadRequests();

    // Set up periodic refresh
    const intervalId = setInterval(loadRequests, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Listen for updates
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('RefundsTab: Storage change event');
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (storedRequests) {
        console.log('RefundsTab: Found stored requests on storage change:', storedRequests);
        const parsedRequests = JSON.parse(storedRequests);
        console.log('RefundsTab: All requests after storage change:', parsedRequests);
        setReturnRequests(parsedRequests);
      }
    };

    const handleCustomEvent = () => {
      console.log('RefundsTab: Handling refundRequestUpdate event');
      const storedRequests = sessionStorage.getItem('returnRequests');
      if (storedRequests) {
        console.log('RefundsTab: Found stored requests on custom event:', storedRequests);
        const parsedRequests = JSON.parse(storedRequests);
        console.log('RefundsTab: All requests after custom event:', parsedRequests);
        setReturnRequests(parsedRequests);
      }
    };

    // Load initial data
    const storedRequests = sessionStorage.getItem('returnRequests');
    if (storedRequests) {
      console.log('RefundsTab: Initial load found requests:', storedRequests);
      const parsedRequests = JSON.parse(storedRequests);
      console.log('RefundsTab: Initial all requests:', parsedRequests);
      setReturnRequests(parsedRequests);
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refundRequestUpdate', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refundRequestUpdate', handleCustomEvent as EventListener);
    };
  }, []);

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
            <Card key={request.id} onClick={() => {
              setSelectedRequest(request);
              setOpen(true);
            }} className="cursor-pointer hover:bg-gray-50">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{request.storeName}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {request.status}
                    </span>
                  </div>
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
                    {request.status === 'Pending' && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
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
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundsTab;
