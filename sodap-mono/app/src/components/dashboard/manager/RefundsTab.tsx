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
  DialogDescription,
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
  // Filter requests to show both pending and approved requests
  const [showAllRequests, setShowAllRequests] = useState(false);

  // Get all requests, including approved ones
  const allRequests = React.useMemo(() => {
    try {
      const storedRequests = JSON.parse(
        localStorage.getItem("sodap-return-requests") || "[]"
      );
      return storedRequests;
    } catch (err) {
      console.error("Error parsing return requests from localStorage:", err);
      return [];
    }
  }, []); // Remove unnecessary dependency

  // Display either all requests or just pending ones based on filter
  const displayedRequests = React.useMemo(() => {
    return showAllRequests ? allRequests : returnRequests;
  }, [showAllRequests, allRequests, returnRequests]);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Wallet connection
  const { connected, publicKey } = useWallet();
  const { processRefund } = useRefundTransaction();

  // Check if connected wallet is the store manager wallet
  const isStoreManagerWallet =
    publicKey?.toBase58() === WALLET_CONFIG.STORE_MANAGER;

  // Store manager wallet address for display
  const storeManagerWallet = WALLET_CONFIG.STORE_MANAGER;

  const handleApproveRefund = async (request: ReturnRequest) => {
    // Reset error message
    setErrorMessage(null);
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

      // Process refund using the stored buyer address
      // Validate buyer address before creating PublicKey
      if (!request.buyerAddress) {
        toast.error("Buyer wallet address is missing");
        return;
      }

      try {
        // Get the request from localStorage to ensure we have the latest data
        const storedRequests = JSON.parse(
          localStorage.getItem("sodap-return-requests") || "[]"
        );

        // First try to find by ID
        let currentRequest = storedRequests.find(
          (req: ReturnRequest) => req.id === request.id
        );

        // If not found by ID, try to find by transaction signature as fallback
        if (!currentRequest && request.transactionSignature) {
          currentRequest = storedRequests.find(
            (req: ReturnRequest) =>
              req.transactionSignature === request.transactionSignature
          );
        }

        // If still not found, use the provided request but log a warning
        if (!currentRequest) {
          console.warn(
            "Return request not found in localStorage, using provided request"
          );
          currentRequest = request;
        }

        // Create a purchase object from the request
        const purchase: Purchase = {
          id: currentRequest.id,
          transactionSignature: currentRequest.transactionSignature,
          storeName: currentRequest.storeName,
          items: currentRequest.items,
          receiptAddress: currentRequest.receiptAddress,
          storeAddress: currentRequest.storeAddress,
          buyerAddress: currentRequest.buyerAddress,
          purchaseTimestamp: currentRequest.purchaseTimestamp,
          totalAmount: currentRequest.totalAmount,
        };

        // Process the refund
        console.log("Processing refund for purchase:", purchase);
        toast.loading("Processing refund transaction...", {
          id: "refund-toast",
        });

        try {
          const result = await processRefund(purchase);

          if (result.status === "success") {
            console.log("Refund processed successfully:", result);
            toast.success("Refund processed successfully!", {
              id: "refund-toast",
            });

            // Update the request status in localStorage
            const updatedRequests = storedRequests.map((req: ReturnRequest) =>
              req.id === currentRequest.id
                ? {
                    ...req,
                    status: "Approved",
                    refundSignature: result.signature,
                    refundDate: new Date().toISOString(),
                  }
                : req
            );
            localStorage.setItem(
              "sodap-return-requests",
              JSON.stringify(updatedRequests)
            );

            setOpen(false);

            // Update the selected request with the refund information
            if (selectedRequest) {
              setSelectedRequest({
                ...selectedRequest,
                status: "Approved",
                refundSignature: result.signature,
                refundDate: new Date().toISOString(),
              });
            }

            // Refresh the requests list
            refreshRequests();

            // Dispatch an event to notify other components
            window.dispatchEvent(new CustomEvent("refundRequestUpdate"));
          } else if (result.status === "pending") {
            console.log("Refund transaction is pending:", result);
            toast.info(
              "Transaction submitted but still confirming. Please check your wallet and Solana Explorer.",
              { id: "refund-toast" }
            );

            // Update the request with pending status and signature
            const updatedRequests = storedRequests.map((req: ReturnRequest) =>
              req.id === currentRequest.id
                ? {
                    ...req,
                    status: "Processing",
                    refundSignature: result.signature,
                    refundDate: new Date().toISOString(),
                  }
                : req
            );
            localStorage.setItem(
              "sodap-return-requests",
              JSON.stringify(updatedRequests)
            );

            setOpen(false);

            // Update the selected request with the pending information
            if (selectedRequest) {
              setSelectedRequest({
                ...selectedRequest,
                status: "Processing",
                refundSignature: result.signature,
                refundDate: new Date().toISOString(),
              });
            }

            // Refresh the requests list
            refreshRequests();

            // Dispatch an event to notify other components
            window.dispatchEvent(new CustomEvent("refundRequestUpdate"));
          } else {
            console.error(
              "Refund transaction failed with status:",
              result.status
            );
            setErrorMessage(
              "Refund transaction failed. Please check your wallet balance and try again."
            );
            toast.error(
              "Failed to process refund. Please check your wallet balance.",
              { id: "refund-toast" }
            );
          }
        } catch (err) {
          console.error("Error in refund transaction:", err);
          let errorMsg = "Refund transaction failed. ";

          // Extract more specific error message if available
          if (err instanceof Error) {
            if (
              err.message.includes("insufficient funds") ||
              err.message.includes("Insufficient funds")
            ) {
              errorMsg +=
                "Insufficient funds in store wallet. Please add SOL to the store wallet and try again.";
            } else if (
              err.message.includes("timeout") ||
              err.message.includes("Timeout")
            ) {
              errorMsg +=
                "Transaction timed out. The network may be congested. Please try again later.";
            } else if (err.message.includes("rejected")) {
              errorMsg += "Transaction was rejected by your wallet.";
            } else {
              errorMsg += err.message;
            }
          } else {
            errorMsg += "Please try again.";
          }

          setErrorMessage(errorMsg);
          toast.error(errorMsg, { id: "refund-toast" });
        }
      } catch (err) {
        console.error("Error processing refund:", err);
        setErrorMessage(
          `Error: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        toast.error("Failed to process refund");
      } finally {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error in handleApproveRefund:", err);
      setErrorMessage(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      toast.error("Failed to process refund");
      setIsProcessing(false);
    }
  };

  const createPurchaseData = (signature: string): Purchase => {
    // Create a mock purchase for testing
    return {
      id: `purchase_${Math.random().toString(36).substring(2, 9)}`,
      transactionSignature: signature,
      storeName: "SoDap Test Store",
      items: [
        { name: "Digital Art Print", price: 0.5, quantity: 1 },
        { name: "Premium Frame", price: 0.2, quantity: 1 },
      ],
      receiptAddress: "receipt_1",
      storeAddress: "store_1",
      buyerAddress: "DfhzrfdE5VDk43iP1NL8MLS5xFaxquxJVFtjhjRmHLAW",
      purchaseTimestamp: Math.floor(Date.now() / 1000),
      totalAmount: 0.7,
    };
  };

  const addTransactionToRefunds = async (signature: string) => {
    try {
      // Create a mock purchase
      const purchase = createPurchaseData(signature);

      // Create a return request
      const newRequest: ReturnRequest = {
        id: `ret_${Math.random().toString(36).substring(2, 9)}`,
        purchaseId: purchase.id,
        date: new Date().toISOString(),
        items: purchase.items,
        reason: "Test return request",
        status: "Pending",
        storeName: purchase.storeName,
        transactionSignature: purchase.transactionSignature,
        receiptAddress: purchase.receiptAddress,
        storeAddress: purchase.storeAddress,
        buyerAddress: purchase.buyerAddress,
        purchaseTimestamp: purchase.purchaseTimestamp,
        totalAmount: purchase.totalAmount,
      };

      // Add to localStorage
      try {
        const existingRequests = JSON.parse(
          localStorage.getItem("sodap-return-requests") || "[]"
        );
        const updatedRequests = [...existingRequests, newRequest];
        localStorage.setItem(
          "sodap-return-requests",
          JSON.stringify(updatedRequests)
        );

        // Also update sessionStorage for backward compatibility
        sessionStorage.setItem(
          "returnRequests",
          JSON.stringify(updatedRequests)
        );

        toast.success("Test return request added successfully");

        // Refresh the requests list
        refreshRequests();

        // Dispatch an event to notify other components
        window.dispatchEvent(
          new CustomEvent("returnRequestsUpdated", {
            detail: { requests: updatedRequests },
          })
        );
      } catch (err) {
        console.error("Error saving return request to localStorage:", err);
        toast.error("Failed to save return request");
      }
    } catch (error) {
      console.error("Error adding transaction to refunds:", error);
      toast.error("Failed to create return request");
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

      // Update request status in localStorage
      const savedRequests = JSON.parse(
        localStorage.getItem("sodap-return-requests") || "[]"
      );
      const updatedRequests = savedRequests.map((req: ReturnRequest) =>
        req.id === request.id ? { ...req, status: "Rejected" } : req
      );
      localStorage.setItem(
        "sodap-return-requests",
        JSON.stringify(updatedRequests)
      );

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
          <h2 className="text-2xl font-bold" id="pending-requests-list">
            Pending Refund Requests
          </h2>
          <div className="flex gap-4 items-center">
            <Button
              onClick={() =>
                addTransactionToRefunds(
                  "2RhSsBGg9xTZ7QyNmZY5ozdStTDnfLYBa2dtFaZ8aUHdqvymm2HaUPJvVMEcqcBJFcYmnj1vgKRitp7jNY5ni53H"
                )
              }
              variant="outline"
              size="sm"
            >
              Add Transaction to Refunds
            </Button>
            <WalletMultiButton />
          </div>
        </div>

        {!connected ? (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Alert className="mb-4 border-yellow-500 bg-yellow-50">
                  <AlertTitle>Wallet not connected</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to manage refund requests.
                  </AlertDescription>
                </Alert>
                <WalletMultiButton className="bg-sodap-purple hover:bg-sodap-purple/90" />
              </div>
            </CardContent>
          </Card>
        ) : !isStoreManagerWallet ? (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <Alert className="mb-4 border-red-500 bg-red-50">
                <AlertTitle>Wrong wallet connected</AlertTitle>
                <AlertDescription>
                  Please connect with the store manager wallet:
                  <span className="font-mono text-sm block mt-1 bg-gray-100 p-1 rounded">
                    {storeManagerWallet}
                  </span>
                </AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <WalletMultiButton className="bg-sodap-purple hover:bg-sodap-purple/90" />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="text-sm text-gray-500 mb-4">
          Total pending requests: {returnRequests.length}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Refund Requests</h3>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            {returnRequests.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {showAllRequests
              ? `Showing all requests (${allRequests.length})`
              : `Pending requests: ${returnRequests.length}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllRequests(!showAllRequests)}
          >
            {showAllRequests ? "Show Pending Only" : "Show All Requests"}
          </Button>
        </div>
      </div>

      {displayedRequests.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Refund Requests</h3>
              <p className="text-gray-500">
                {showAllRequests
                  ? "There are no refund requests to display."
                  : "There are no pending refund requests."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayedRequests.map((request) => (
            <Card
              key={request.id}
              className={`
                ${
                  request.status === "Approved"
                    ? "border-green-200 bg-green-50"
                    : ""
                }
                ${
                  request.status === "Rejected"
                    ? "border-red-200 bg-red-50"
                    : ""
                }
                ${
                  request.status === "Processing"
                    ? "border-blue-200 bg-blue-50"
                    : ""
                }
                ${request.status === "Pending" ? "border-yellow-200" : ""}
                hover:shadow-md transition-shadow
              `}
              onClick={() => {
                setSelectedRequest(request);
                setOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{request.storeName}</h4>
                    <p className="text-sm text-gray-500">
                      Request Date:{" "}
                      {new Date(request.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: {request.totalAmount.toFixed(2)} SOL
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`
                      px-3 py-1 rounded-full text-xs
                      ${
                        request.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                      ${
                        request.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : ""
                      }
                      ${
                        request.status === "Processing"
                          ? "bg-blue-100 text-blue-800"
                          : ""
                      }
                      ${
                        request.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : ""
                      }
                    `}
                    >
                      {request.status}
                    </span>
                    {(request.status === "Approved" ||
                      request.status === "Processing") &&
                      request.refundSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${request.refundSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Refund Transaction
                        </a>
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
            <DialogDescription>
              Review the details of this refund request.
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <Alert className="mb-4 border-yellow-500 bg-yellow-50">
              <AlertTitle className="text-yellow-800">Warning</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
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
                {selectedRequest.status === "Approved" ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Refunded
                    </span>
                    {selectedRequest.refundSignature && (
                      <a
                        href={`https://explorer.solana.com/tx/${selectedRequest.refundSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Refund Transaction
                      </a>
                    )}
                  </div>
                ) : selectedRequest.status === "Processing" ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Processing Refund
                    </span>
                    {selectedRequest.refundSignature && (
                      <a
                        href={`https://explorer.solana.com/tx/${selectedRequest.refundSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Check Transaction Status
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectRefund(selectedRequest)}
                      disabled={
                        isProcessing || selectedRequest.status !== "Pending"
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveRefund(selectedRequest)}
                      className="bg-green-500 hover:bg-green-600"
                      disabled={
                        isProcessing ||
                        !connected ||
                        !isStoreManagerWallet ||
                        selectedRequest.status !== "Pending"
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundsTab;
