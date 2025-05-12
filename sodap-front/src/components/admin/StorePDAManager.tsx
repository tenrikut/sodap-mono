import { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StorePDAManager: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [storePDA, setStorePDA] = useState<string | null>(null);
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

      const [storePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("store"), publicKey.toBuffer()],
        // Replace with your program ID
        new PublicKey("YOUR_PROGRAM_ID")
      );

      setStorePDA(storePDA.toString());
      toast({
        title: "Store PDA Created",
        description: "Your store PDA has been successfully created",
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
    <Card>
      <CardHeader>
        <CardTitle>Store PDA Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={createStorePDA}
          disabled={loading || !publicKey}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Store PDA"}
        </Button>

        {storePDA && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">Store PDA:</p>
            <p className="break-all text-sm">{storePDA}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
