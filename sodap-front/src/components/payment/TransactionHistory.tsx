"use client";

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ConfirmedSignatureInfo } from "@solana/web3.js";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ExternalLink } from "lucide-react";
import { TransactionDetails } from "./TransactionDetails";

export const TransactionHistory = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<ConfirmedSignatureInfo[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<string | null>(
    null
  );

  const fetchTransactions = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      // Get the most recent 10 transactions
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 10,
      });
      setTransactions(signatures);

      // Select the first transaction by default if we have transactions
      if (signatures.length > 0 && !selectedSignature) {
        setSelectedSignature(signatures[0].signature);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to fetch transaction history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setSelectedSignature(null);
    }
  }, [publicKey, connection]);

  if (!publicKey) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Connect your wallet to view your transaction history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No transactions found for this wallet
            </p>
          ) : (
            <Tabs
              defaultValue={selectedSignature || "view"}
              className="w-full"
              onValueChange={(value) => setSelectedSignature(value)}
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="view">Transaction List</TabsTrigger>
                <TabsTrigger
                  value={selectedSignature || "details"}
                  disabled={!selectedSignature}
                >
                  Transaction Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="view" className="mt-4 space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.signature}
                    className="border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedSignature(tx.signature)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium truncate max-w-[200px]">
                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.blockTime
                          ? format(
                              new Date(tx.blockTime * 1000),
                              "MMM dd, yyyy HH:mm"
                            )
                          : "Pending"}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            tx.err
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {tx.err ? "Failed" : "Success"}
                        </span>
                      </div>
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sodap-purple hover:underline text-xs flex items-center gap-1"
                      >
                        View <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {selectedSignature && (
                <TabsContent value={selectedSignature} className="mt-4">
                  <TransactionDetails signature={selectedSignature} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
