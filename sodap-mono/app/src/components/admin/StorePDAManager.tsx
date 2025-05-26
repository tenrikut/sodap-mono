import { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PROGRAM_ID as PROGRAM_ID_STRING } from "@/utils/anchor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface StorePDAManagerProps {
  storeId: string;
  storeName: string;
  walletAddress?: string;
  hasPda?: boolean;
  onPdaCreated?: (storeId: string, pdaAddress: string) => void;
}

export const StorePDAManager: FC<StorePDAManagerProps> = ({
  storeId,
  storeName,
  walletAddress,
  hasPda = false,
  onPdaCreated
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [storePDA, setStorePDA] = useState<string | null>(hasPda ? "PDA exists" : null);
  const [loading, setLoading] = useState(false);

  const createStorePDA = async () => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Convert the storeId string to a PublicKey
      const storePublicKey = new PublicKey(storeId);
      
      // Generate the PDA using the store ID and the program ID
      // Convert PROGRAM_ID_STRING to a PublicKey object
      const programId = new PublicKey(PROGRAM_ID_STRING);
      
      const [storePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("store"), storePublicKey.toBuffer()],
        programId // Use the program ID as a PublicKey object
      );

      const pdaAddress = storePDA.toString();
      setStorePDA(pdaAddress);

      // Call the callback to update the parent component
      if (onPdaCreated) {
        onPdaCreated(storeId, pdaAddress);
      }
      
      toast({
        title: "Store PDA Created",
        description: `PDA created for store: ${storeName}`,
      });
    } catch (err) {
      console.error("Error creating store PDA:", err);
      toast({
        title: "Error",
        description: "Failed to create store PDA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={createStorePDA}
      disabled={loading || !publicKey || hasPda}
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          Creating...
        </>
      ) : (
        <>Create PDA</>
      )}
    </Button>
  );
};
