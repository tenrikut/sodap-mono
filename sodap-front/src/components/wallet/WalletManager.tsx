import { FC, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const WalletManager: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{
    balance: number;
    solscanUrl: string;
  } | null>(null);

  useEffect(() => {
    if (publicKey) {
      updateWalletInfo();
    }
  }, [publicKey]);

  const updateWalletInfo = async () => {
    if (!publicKey) return;

    try {
      const balance = await connection.getBalance(publicKey);
      const solscanUrl = `https://solscan.io/account/${publicKey.toString()}`;
      setWalletInfo({
        balance: balance / 10 ** 9, // Convert lamports to SOL
        solscanUrl,
      });
    } catch (err) {
      console.error("Error fetching wallet info:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {publicKey ? (
          <>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-semibold">Wallet Address:</p>
              <p className="break-all text-sm">{publicKey.toString()}</p>

              {walletInfo && (
                <>
                  <p className="font-semibold mt-4">Balance:</p>
                  <p>{walletInfo.balance} SOL</p>
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => window.open(walletInfo.solscanUrl, "_blank")}
                  >
                    View on Solscan
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={updateWalletInfo}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Refresh Balance
            </Button>
          </>
        ) : (
          <p className="text-center text-muted-foreground">
            Connect your wallet to view details
          </p>
        )}
      </CardContent>
    </Card>
  );
};
