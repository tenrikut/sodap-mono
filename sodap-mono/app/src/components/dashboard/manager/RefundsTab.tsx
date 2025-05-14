import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WALLET_CONFIG } from "@/config/wallets";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useRefundTransaction } from "@/hooks/useRefundTransaction";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

import { ReturnRequest, useReturnRequests } from "@/hooks/useReturnRequests";

interface Purchase {
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

const RefundsTab = () => {
  const { returnRequests, refreshRequests } = useReturnRequests();
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Wallet connection
  const { connected, publicKey } = useWallet();
  const { processRefund } = useRefundTransaction();

  // Check if connected wallet is the store manager wallet
  const isStoreManagerWallet =
    publicKey?.toBase58() === WALLET_CONFIG.STORE_MANAGER;


  const handleApproveRefund = async (request: ReturnRequest) => {
    try {
      // Check wallet connection
      if (!connected) {
        toast.error("Please connect your wallet first.");
        return;
      }

      // Check if connected wallet is store manager
      if (!isStoreManagerWallet) {
        toast.error("Only store manager can approve refunds.");
        return;
      }

      setSelectedRequest(request);
      setIsProcessing(true);

      // Process refund using the stored buyer wallet address
      // Validate buyer address before creating PublicKey
      if (!request.buyerAddress) {
        toast.error('Buyer wallet address is missing');
        return;
      }

      setIsProcessing(true);

      try {
        // Get the request from sessionStorage to ensure we have the latest data
        const storedRequests = JSON.parse(sessionStorage.getItem("returnRequests") || "[]");
        const currentRequest = storedRequests.find((req: ReturnRequest) => req.id === request.id);
        
        if (!currentRequest) {
          toast.error('Return request not found');
          return;
        }

        // Validate buyer address
        if (!currentRequest.buyerAddress || typeof currentRequest.buyerAddress !== 'string') {
          console.error('Missing buyer address:', currentRequest);
          toast.error('Buyer wallet address is missing');
          return;
        }

        // Create PublicKey from buyer address
        let buyerPublicKey: PublicKey;
        try {
          buyerPublicKey = new PublicKey(currentRequest.buyerAddress.trim());
        } catch (error) {
          console.error('Error creating PublicKey:', error);
          toast.error('Invalid buyer wallet address format');
          return;
        }

        // Calculate total amount to refund
        const totalAmount = currentRequest.items.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        );

        // Process the refund
        const result = await processRefund(
          {
            ...currentRequest,
            totalAmount: totalAmount || currentRequest.totalAmount
          },
          buyerPublicKey
        );

        if (!result?.signature) {
          toast.error('No transaction signature received');
          return;
        }

        // Update request status in sessionStorage
        const updatedRequests = storedRequests.map((req: ReturnRequest) =>
          req.id === request.id ? { 
            ...req, 
            status: "Approved",
            refundSignature: result.signature
          } : req
        );
        sessionStorage.setItem("returnRequests", JSON.stringify(updatedRequests));

        toast.success("Refund processed successfully!");
        setOpen(false);

        // Notify other tabs
        window.dispatchEvent(new CustomEvent("refundRequestUpdate"));
      } catch (error) {
        console.error("Error processing refund:", error);
        toast.error("Failed to process refund. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedRequest(null);
    }
  };

  const createPurchaseData = (signature: string): Purchase => {
    return {
      id: signature,
      transactionSignature: signature,
      storeName: 'SoDap Store',
      items: [
        {
          name: 'Watch Model X',
          quantity: 1,
          price: 0.1 // 0.1 SOL
        }
      ],
      receiptAddress: signature,
      storeAddress: WALLET_CONFIG.STORE_MANAGER,
      buyerAddress: WALLET_CONFIG.DEFAULT_BUYER,
      purchaseTimestamp: Math.floor(Date.now() / 1000),
      totalAmount: 0.1
    };
  };

  const addTransactionToRefunds = async (signature: string) => {
    try {
      console.log('Adding transaction to refunds:', signature);
      
      // Try to get the purchase from lastPurchase first
      let purchase: Purchase | null = null;
      const lastPurchaseStr = sessionStorage.getItem('lastPurchase');
      console.log('Last purchase from storage:', lastPurchaseStr);
      
      if (lastPurchaseStr) {
        const lastPurchase = JSON.parse(lastPurchaseStr) as Purchase;
        console.log('Parsed last purchase:', lastPurchase);
        if (lastPurchase.transactionSignature === signature) {
          purchase = lastPurchase;
          console.log('Found purchase in lastPurchase');
        }
      }

      // If not found in lastPurchase, try the purchases array
      if (!purchase) {
        console.log('Checking purchases array...');
        const purchasesStr = sessionStorage.getItem('purchases');
        console.log('Purchases from storage:', purchasesStr);
        
        if (purchasesStr) {
          const purchases = JSON.parse(purchasesStr) as Purchase[];
          console.log('Parsed purchases:', purchases);
          purchase = purchases.find((p) => p.transactionSignature === signature);
          if (purchase) {
            console.log('Found purchase in purchases array');
          }
        }

        // If still not found, create new purchase data
        if (!purchase) {
          console.log('Creating new purchase data for:', signature);
          purchase = createPurchaseData(signature);
          
          // Save to purchases array
          const purchases = JSON.parse(sessionStorage.getItem('purchases') || '[]') as Purchase[];
          purchases.unshift(purchase);
          sessionStorage.setItem('purchases', JSON.stringify(purchases));
          console.log('Saved new purchase to storage');
        }
      }

      if (!purchase) {
        toast.error('Purchase not found for this transaction');
        return;
      }

      // Create a new return request
      const newRequest: ReturnRequest = {
        id: `ret_${Math.random().toString(36).substring(2, 9)}`,
        purchaseId: purchase.id,
        date: new Date().toISOString(),
        items: purchase.items,
        reason: 'Customer requested refund',
        status: 'Pending',
        storeName: purchase.storeName,
        transactionSignature: purchase.transactionSignature,
        receiptAddress: purchase.receiptAddress,
        storeAddress: purchase.storeAddress,
        buyerAddress: purchase.buyerAddress,
        purchaseTimestamp: purchase.purchaseTimestamp,
        totalAmount: purchase.totalAmount
      };

      // Get existing requests
      const existingRequests = JSON.parse(sessionStorage.getItem('returnRequests') || '[]');

      // Add new request
      const updatedRequests = [newRequest, ...existingRequests];
      sessionStorage.setItem('returnRequests', JSON.stringify(updatedRequests));

      // Refresh the requests list
      await refreshRequests();

      toast.success('Return request created successfully');
      
      // Scroll to the requests list
      const requestsList = document.getElementById('pending-requests-list');
      if (requestsList) {
        requestsList.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error adding transaction to refunds:', error);
      toast.error('Failed to create return request');
    }
  };

  const handleRejectRefund = async (request: ReturnRequest) => {
    try {
      // Check wallet connection
      if (!connected) {
        toast.error("Please connect your wallet first.");
        return;
      }

      // Check if connected wallet is store manager
      if (!isStoreManagerWallet) {
        toast.error("Only store manager can reject refunds.");
        return;
      }

      // Update request status in sessionStorage
      const savedRequests = JSON.parse(sessionStorage.getItem("returnRequests") || "[]");
      const updatedRequests = savedRequests.map((req: ReturnRequest) =>
        req.id === request.id ? { ...req, status: "Rejected" } : req
      );
      sessionStorage.setItem("returnRequests", JSON.stringify(updatedRequests));

      setSelectedRequest(null);
      setOpen(false);
      toast.success("Refund rejected successfully");

      // Notify other tabs
      window.dispatchEvent(new CustomEvent("refundRequestUpdate"));
    } catch (error) {
      console.error("Error rejecting refund:", error);
      toast.error("Failed to reject refund");
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold" id="pending-requests-list">Pending Refund Requests</h2>
          <div className="flex gap-4 items-center">
            <Button
              onClick={() => addTransactionToRefunds("2RhSsBGg9xTZ7QyNmZY5ozdStTDnfLYBa2dtFaZ8aUHdqvymm2HaUPJvVMEcqcBJFcYmnj1vgKRitp7jNY5ni53H")}
              variant="outline"
              size="sm"
            >
              Add Transaction to Refunds
            </Button>
            <WalletMultiButton />
          </div>
        </div>

        {!connected && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Wallet not connected</AlertTitle>
            <AlertDescription>
              Please connect your wallet to process refunds
            </AlertDescription>
          </Alert>
        )}

        {connected && !isStoreManagerWallet && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Wrong wallet connected</AlertTitle>
            <AlertDescription>
              Please connect with the store manager wallet:
              9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-500 mb-4">
          Total pending requests: {returnRequests.length}
        </div>
      </div>

      {returnRequests.length === 0 ? (
        <p className="text-gray-500">No pending refund requests.</p>
      ) : (
        <div className="space-y-4">
          {returnRequests.map((request) => (
            <Card
              key={request.id}
              onClick={() => {
                setSelectedRequest(request);
                setOpen(true);
              }}
              className="cursor-pointer hover:bg-gray-50"
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{request.storeName}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        request.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
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
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span>{item.price.toFixed(2)} SOL</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Return Reason
                    </h4>
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
                    {request.status === "Pending" && (
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
                          disabled={
                            isProcessing || !connected || !isStoreManagerWallet
                          }
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Process Refund"
                          )}
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
            <p className="text-sm text-gray-500">
              Review the refund request details before processing.
            </p>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedRequest.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>{item.price.toFixed(2)} SOL</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Return Reason</h4>
                <p className="text-sm text-gray-500">
                  {selectedRequest.reason}
                </p>
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
                  disabled={isProcessing || !connected || !isStoreManagerWallet}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process Refund"
                  )}
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
