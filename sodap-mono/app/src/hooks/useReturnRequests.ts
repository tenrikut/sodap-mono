import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

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
}

export const useReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  // Load return requests from storage on mount
  useEffect(() => {
    const storedRequests = sessionStorage.getItem('returnRequests');
    if (storedRequests) {
      setReturnRequests(JSON.parse(storedRequests));
    }
  }, []);

  const createReturnRequest = useCallback(async (
    purchase: {
      id: string;
      storeName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      transactionSignature: string;
    },
    reason: string
  ) => {
    console.log('createReturnRequest called with:', { purchase, reason });
    try {
      // Create a new return request
      const newRequest: ReturnRequest = {
        id: `ret_${Math.random().toString(36).substring(2, 9)}`,
        purchaseId: purchase.id,
        date: new Date().toISOString(),
        items: purchase.items,
        reason,
        status: 'Pending' as const,
        storeName: purchase.storeName,
        transactionSignature: purchase.transactionSignature
      };
      
      console.log('Created new return request:', newRequest);

      console.log('Saving new return request:', newRequest);
      
      // Get existing requests
      const existingRequestsStr = sessionStorage.getItem('returnRequests');
      console.log('Raw existing requests from storage:', existingRequestsStr);
      
      let existingRequests = [];
      try {
        if (existingRequestsStr) {
          existingRequests = JSON.parse(existingRequestsStr);
          console.log('Parsed existing requests:', existingRequests);
        }
      } catch (err) {
        console.error('Error parsing existing requests:', err);
        // Initialize with empty array if parse fails
        sessionStorage.setItem('returnRequests', '[]');
      }
      
      // Add the new request
      const updated = [newRequest, ...existingRequests];
      console.log('Final updated requests array:', updated);
      
      // Store in session storage
      sessionStorage.setItem('returnRequests', JSON.stringify(updated));
      
      // Update state
      setReturnRequests(updated);
      
      // Dispatch custom event
      console.log('Dispatching returnRequestsUpdated event');
      window.dispatchEvent(new CustomEvent('returnRequestsUpdated', {
        detail: { requests: updated }
      }));

      // Show success message
      toast.success('Return request submitted successfully');

      return newRequest;
    } catch (error) {
      console.error('Error creating return request:', error);
      toast.error('Failed to submit return request');
      throw error;
    }
  }, []);

  return {
    returnRequests,
    createReturnRequest
  };
};
