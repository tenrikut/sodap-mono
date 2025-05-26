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
  onContinue: () => void;
  transactionSignature?: string | null;
}

export const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onOpenChange,
  onContinue,
  transactionSignature
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Transaction signature copied to clipboard");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl">
            <PartyPopper className="h-7 w-7 text-green-500" />
            <span>Payment Successful!</span>
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Thank you for your purchase
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="bg-gradient-to-r from-green-100 to-teal-100 p-6 rounded-lg text-center">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-8 py-4 rounded-full font-bold text-xl inline-block">
              Payment Confirmed
            </div>
          </div>

          <p className="text-sm text-center text-gray-500">
            Your purchase has been completed and your items will be delivered soon.
          </p>
          
          {transactionSignature && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Transaction Details</h4>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                  <div className="text-xs text-gray-600 break-all">
                    {transactionSignature}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(transactionSignature)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <a 
                  href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sodap-purple flex items-center gap-1 hover:underline bg-gray-50 px-4 py-2 rounded-md"
                >
                  View on Explorer <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          <Button 
            onClick={onContinue} 
            className="w-full bg-sodap-purple hover:bg-purple-700 py-6 text-base"
          >
            Continue Shopping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
