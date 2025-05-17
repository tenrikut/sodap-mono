import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface Purchase {
  id: string;
  transactionSignature: string;
  storeName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  receiptAddress: string;
  storeAddress: string;
  buyerAddress: string;
  purchaseTimestamp: number;
  totalAmount: number;
}

export interface ReturnRequest {
  id: string;
  purchaseId: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  storeName: string;
  transactionSignature: string;
  receiptAddress: string;
  storeAddress: string;
  buyerAddress: string;
  purchaseTimestamp: number;
  totalAmount: number;
}

export const useReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  const refreshRequests = useCallback(async () => {
    const storedRequests = sessionStorage.getItem('returnRequests');
    if (storedRequests) {
      setReturnRequests(JSON.parse(storedRequests));
    }
  }, []);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'returnRequests') {
        const newRequests = e.newValue ? JSON.parse(e.newValue) : [];
        setReturnRequests(newRequests);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createReturnRequest = useCallback(async (purchase: Purchase, reason: string) => {
    try {
      const newRequest: ReturnRequest = {
        id: `ret_${Math.random().toString(36).substring(2, 9)}`,
        purchaseId: purchase.id,
        date: new Date().toISOString(),
        items: purchase.items,
        reason,
        status: 'Pending',
        storeName: purchase.storeName,
        transactionSignature: purchase.transactionSignature,
        receiptAddress: purchase.receiptAddress,
        storeAddress: purchase.storeAddress,
        buyerAddress: purchase.buyerAddress,
        purchaseTimestamp: purchase.purchaseTimestamp,
        totalAmount: purchase.totalAmount
      };

      const existingRequestsStr = sessionStorage.getItem('returnRequests');
      const existingRequests = existingRequestsStr ? JSON.parse(existingRequestsStr) : [];

      const updatedRequests = [newRequest, ...existingRequests];
      sessionStorage.setItem('returnRequests', JSON.stringify(updatedRequests));
      setReturnRequests(updatedRequests);

      toast.success('Return request submitted successfully');

      return newRequest;
    } catch (error) {
      console.error('Error creating return request:', error);
      toast.error('Failed to create return request');
      throw error;
    }
  }, []);

  return {
    returnRequests,
    createReturnRequest,
    refreshRequests
  };
};
