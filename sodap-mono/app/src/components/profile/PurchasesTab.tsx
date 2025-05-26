import React, { useState, useEffect } from 'react';
import { useAnchor } from '@/hooks/useAnchor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePurchaseHistory, Purchase } from '@/hooks/usePurchaseHistory';
import { useReturnRequests } from '@/hooks/useReturnRequests';
import { Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// PurchaseCard component to display individual purchases
const PurchaseCard = ({ purchase, onRequestReturn }: { purchase: Purchase; onRequestReturn: (purchase: Purchase) => void }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{purchase.storeName}</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDate(purchase.date)}</p>
          </div>
          {purchase.isReturned && purchase.returnStatus && (
            <div>
              {purchase.returnStatus === 'Pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Return Pending
                </span>
              )}
              {purchase.returnStatus === 'Approved' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Refund Successful
                </span>
              )}
              {purchase.returnStatus === 'Rejected' && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  Return Rejected
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {purchase.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span>{item.price.toFixed(2)} SOL</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>{purchase.totalAmount.toFixed(2)} SOL</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <a 
            href={`https://explorer.solana.com/tx/${purchase.transactionSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            View Transaction
          </a>
          
          {!purchase.isReturned ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRequestReturn(purchase)}
            >
              Request Return
            </Button>
          ) : purchase.returnStatus === 'Approved' && purchase.refundSignature ? (
            <a 
              href={`https://explorer.solana.com/tx/${purchase.refundSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              View Refund
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

const PurchasesTab: React.FC = () => {
  const { walletAddress, connectWallet } = useAnchor();
  const { purchases, isLoading, error, refetch } = usePurchaseHistory();
  const { createReturnRequest } = useReturnRequests();
  
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Add a function to fetch purchases with better user feedback
  const handleRefreshPurchases = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing purchase history...");
    
    try {
      // First try to refresh from the blockchain
      await refetch();
      
      // Check if we have purchases in state
      if (purchases.length === 0) {
        console.log('No purchases in state, checking localStorage directly');
        
        // Check localStorage directly as a fallback
        const storedPurchases = localStorage.getItem('sodap-purchases');
        if (storedPurchases) {
          try {
            const parsedPurchases = JSON.parse(storedPurchases);
            console.log('Found purchases in localStorage:', parsedPurchases.length);
            
            if (parsedPurchases.length > 0) {
              // We found purchases in localStorage, but we can't directly update state here
              // Instead, we'll trigger a refresh which will load them
              toast.success(`Found ${parsedPurchases.length} purchase${parsedPurchases.length === 1 ? '' : 's'} in your history`);
              // Force a refresh of the purchase history hook
              await refetch();
            } else {
              toast.info("No purchases found in your history");
            }
          } catch (err) {
            console.error('Error parsing purchases from localStorage:', err);
          }
        } else {
          console.log('No purchases found in localStorage');
          toast.info("No purchases found in your history");
        }
      } else {
        console.log('Purchases already in state:', purchases.length);
        toast.success(`Found ${purchases.length} purchase${purchases.length === 1 ? '' : 's'} in your history`);
      }
    } catch (err) {
      console.error('Error refreshing purchases:', err);
      toast.error('Failed to refresh purchase history');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Call the refresh function when component mounts or wallet changes
  useEffect(() => {
    // Always try to load purchases, even without a wallet
    // This will use demo data if no wallet is connected
    const timer = setTimeout(() => {
      handleRefreshPurchases();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [walletAddress]);
  
  // Force refresh when the tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing purchases');
        handleRefreshPurchases();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Add console logs to debug the component
  useEffect(() => {
    console.log('PurchasesTab rendered with:', { 
      walletAddress: walletAddress?.toString(), 
      purchases: purchases.length,
      isLoading, 
      error 
    });
  }, [purchases, isLoading, error, walletAddress]);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      toast.success("Wallet connected successfully");
      // Refresh purchases after wallet connection
      handleRefreshPurchases();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle opening the return dialog
  const handleOpenReturnDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowReturnDialog(true);
  };

  // Show wallet connection prompt if not connected
  if (!walletAddress) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your purchase history
            </p>
          </div>
          <Button 
            onClick={handleConnectWallet}
            className="bg-sodap-purple hover:bg-sodap-purple/90"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show error state if there was an error
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-red-500">Error Loading Purchases</h3>
            <p className="text-sm text-muted-foreground">
              {error.toString()}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefreshPurchases}
            disabled={isRefreshing}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render the purchase history
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Purchase History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshPurchases}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading purchase history...</span>
        </div>
      ) : purchases && purchases.length > 0 ? (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <PurchaseCard 
              key={purchase.id} 
              purchase={purchase} 
              onRequestReturn={handleOpenReturnDialog}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No purchase history found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your purchase history will appear here once you make a purchase.
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-sm underline ml-1" 
              onClick={handleRefreshPurchases}
            >
              Try refreshing
            </Button>
          </p>
        </div>
      )}

      <Dialog open={!!selectedPurchase} onOpenChange={() => {
        setSelectedPurchase(null);
        setShowReturnDialog(false);
        setReturnReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Request</DialogTitle>
          </DialogHeader>
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
                    if (selectedPurchase) {
                      // Ensure the purchase has all required fields
                      const completeSelectedPurchase = {
                        ...selectedPurchase,
                        // Add default values for any missing fields
                        receiptAddress: selectedPurchase.receiptAddress || selectedPurchase.id,
                        storeAddress: selectedPurchase.storeAddress || '',
                        buyerAddress: selectedPurchase.buyerAddress || '',
                        purchaseTimestamp: selectedPurchase.purchaseTimestamp || Math.floor(Date.now() / 1000)
                      };
                      await createReturnRequest(completeSelectedPurchase, returnReason);
                      toast.success('Return request submitted successfully');
                    }
                    setSelectedPurchase(null);
                    setShowReturnDialog(false);
                    setReturnReason('');
                    // Refresh purchases to show the updated return status
                    handleRefreshPurchases();
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
};

export default PurchasesTab;
