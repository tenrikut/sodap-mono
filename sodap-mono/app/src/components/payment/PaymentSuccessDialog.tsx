import React from 'react';
import { PartyPopper, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earnedPoints: number;
  currentPoints: number;
  onContinue: () => void;
  transactionSignature?: string | null;
}

export const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onOpenChange,
  earnedPoints,
  currentPoints,
  onContinue,
  transactionSignature
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Transaction signature copied to clipboard");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <PartyPopper className="h-6 w-6 text-green-500" />
            <span>Payment Successful!</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Thank you for your purchase
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">You earned</h3>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full font-bold text-xl inline-block">
              +{earnedPoints} loyalty points
            </div>
            
            <p className="mt-3 text-sm text-gray-600">
              Your current balance: {currentPoints + earnedPoints} points
            </p>
          </div>

          <p className="mt-4 text-sm text-center text-gray-500">
            Your purchase has been completed and your items will be delivered soon.
          </p>
          
          {transactionSignature && (
            <div className="mt-4 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Transaction Details</h4>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded overflow-hidden">
                <div className="text-xs text-gray-600 truncate flex-1">
                  {transactionSignature}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(transactionSignature)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex justify-end">
                <a 
                  href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sodap-purple flex items-center gap-1 hover:underline"
                >
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={onContinue} 
            className="w-full bg-sodap-purple hover:bg-purple-700"
          >
            Continue Shopping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
