import React, { useState } from "react";
import { usePurchaseHistory } from "../hooks/usePurchaseHistory";
import { useAnchor } from "../hooks/useAnchor";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { useReturnRequests } from "../hooks/useReturnRequests";
import { toast } from "sonner";

export default function PurchaseHistory() {
  const { purchases, isLoading, error } = usePurchaseHistory();
  const { walletAddress } = useAnchor();
  const { createReturnRequest } = useReturnRequests();

  // State for return request dialog
  const [selectedPurchase, setSelectedPurchase] = useState<
    (typeof purchases)[0] | null
  >(null);
  const [returnReason, setReturnReason] = useState("");

  if (!walletAddress) {
    return (
      <div className="p-4">
        <p>Please connect your wallet to view purchase history.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p>Loading purchase history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!purchases.length) {
    return (
      <div className="p-4">
        <p>No purchases found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Purchase History</h2>
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{purchase.storeName}</h3>
                <p className="text-gray-500">
                  {new Date(purchase.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{purchase.totalAmount} SOL</p>
                <p className="text-sm text-gray-500">
                  Tx: {purchase.transactionSignature.slice(0, 8)}...
                </p>
                {!purchase.isReturned && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedPurchase(purchase)}
                  >
                    Request Return
                  </Button>
                )}
                {purchase.isReturned && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Return Requested
                  </span>
                )}
              </div>
            </div>
            {purchase.items && purchase.items.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {purchase.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{item.price} SOL</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Return Request Dialog */}
      <Dialog
        open={!!selectedPurchase}
        onOpenChange={() => {
          setSelectedPurchase(null);
          setReturnReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedPurchase.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{item.price} SOL</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="text-sm font-semibold block mb-2"
                >
                  Reason for Return
                </label>
                <Textarea
                  id="reason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Please explain why you want to return these items..."
                  className="w-full"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPurchase(null);
                    setReturnReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!returnReason.trim()) {
                      toast.error("Please provide a reason for the return");
                      return;
                    }

                    try {
                      // Prepare the purchase data for return request
                      const purchaseData = {
                        id: selectedPurchase.id,
                        storeName: selectedPurchase.storeName,
                        items: selectedPurchase.items,
                        transactionSignature:
                          selectedPurchase.transactionSignature,
                      };

                      console.log(
                        "Creating return request for purchase:",
                        purchaseData
                      );
                      const request = await createReturnRequest(
                        purchaseData,
                        returnReason
                      );
                      console.log("Return request created:", request);

                      // Verify the request was saved
                      const savedRequests =
                        sessionStorage.getItem("returnRequests");
                      console.log(
                        "Current return requests in storage:",
                        savedRequests
                      );

                      // Close the dialog
                      setSelectedPurchase(null);
                      setReturnReason("");

                      // Show success message
                      toast.success("Return request submitted successfully");
                    } catch (error) {
                      console.error("Error creating return request:", error);
                      toast.error("Failed to submit return request");
                    }
                  }}
                >
                  Submit Return Request
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
