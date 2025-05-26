import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

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
  status: "Pending" | "Approved" | "Rejected" | "Processing";
  storeName: string;
  transactionSignature: string;
  receiptAddress: string;
  storeAddress: string;
  buyerAddress: string;
  purchaseTimestamp: number;
  totalAmount: number;
  refundSignature?: string;
  refundDate?: string;
}

export const useReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  const refreshRequests = useCallback(async () => {
    const storedRequests = localStorage.getItem("sodap-return-requests");
    if (storedRequests) {
      try {
        const parsedRequests = JSON.parse(storedRequests);
        console.log(
          "Loaded return requests from localStorage:",
          parsedRequests.length
        );
        setReturnRequests(parsedRequests);
      } catch (err) {
        console.error("Error parsing return requests:", err);
      }
    }
  }, []);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sodap-return-requests") {
        const newRequests = e.newValue ? JSON.parse(e.newValue) : [];
        setReturnRequests(newRequests);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const createReturnRequest = useCallback(
    async (purchase: Purchase, reason: string) => {
      try {
        const newRequest: ReturnRequest = {
          id: `ret_${Math.random().toString(36).substring(2, 9)}`,
          purchaseId: purchase.id,
          date: new Date().toISOString(),
          items: purchase.items,
          reason,
          status: "Pending",
          storeName: purchase.storeName,
          transactionSignature: purchase.transactionSignature,
          receiptAddress: purchase.receiptAddress,
          storeAddress: purchase.storeAddress,
          buyerAddress: purchase.buyerAddress,
          purchaseTimestamp: purchase.purchaseTimestamp,
          totalAmount: purchase.totalAmount,
        };

        const existingRequestsStr = localStorage.getItem(
          "sodap-return-requests"
        );
        const existingRequests = existingRequestsStr
          ? JSON.parse(existingRequestsStr)
          : [];

        const updatedRequests = [newRequest, ...existingRequests];
        localStorage.setItem(
          "sodap-return-requests",
          JSON.stringify(updatedRequests)
        );

        // Dispatch a custom event to notify other components
        const event = new CustomEvent("refundRequestUpdate", {
          detail: updatedRequests,
        });
        window.dispatchEvent(event);
        setReturnRequests(updatedRequests);

        toast.success("Return request submitted successfully");

        return newRequest;
      } catch (error) {
        console.error("Error creating return request:", error);
        toast.error("Failed to create return request");
        throw error;
      }
    },
    []
  );

  return {
    returnRequests,
    createReturnRequest,
    refreshRequests,
  };
};
