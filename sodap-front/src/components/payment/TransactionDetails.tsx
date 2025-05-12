"use client";

import React, { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, ParsedTransactionWithMeta } from "@solana/web3.js";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

interface TransactionDetailsProps {
  signature: string;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  signature,
}) => {
  const { connection } = useConnection();
  const [transaction, setTransaction] =
    useState<ParsedTransactionWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionDetails = async () => {
    if (!signature) return;

    setLoading(true);
    setError(null);

    try {
      const txDetails = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      setTransaction(txDetails);
    } catch (err) {
      console.error("Error fetching transaction:", err);
      setError("Failed to fetch transaction details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetails();
  }, [signature, connection]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatLamportsToSOL = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(9);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Transaction Error</CardTitle>
          <CardDescription>
            We couldn't retrieve the transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">{error}</p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={fetchTransactionDetails}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} /> Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!transaction) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Transaction Found</CardTitle>
          <CardDescription>
            No details found for signature: {signature}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            The transaction might be still processing or the signature is
            invalid.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={fetchTransactionDetails}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Extract transaction details
  const blockTime = transaction.blockTime
    ? new Date(transaction.blockTime * 1000)
    : null;
  const slot = transaction.slot;
  const fee = transaction.meta?.fee || 0;
  const status = transaction.meta?.err ? "Failed" : "Success";
  const instructions = transaction.transaction.message.instructions;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Details</CardTitle>
          <Badge variant={status === "Success" ? "success" : "destructive"}>
            {status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span className="truncate">{signature}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(signature)}
          >
            <Copy size={14} />
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Block</h4>
            <p className="text-sm">{slot.toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Time</h4>
            <p className="text-sm">
              {blockTime
                ? format(blockTime, "MMM dd, yyyy HH:mm:ss")
                : "Pending"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Fee</h4>
            <p className="text-sm">{formatLamportsToSOL(fee)} SOL</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Status</h4>
            <Badge variant={status === "Success" ? "success" : "destructive"}>
              {status}
            </Badge>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Accounts Involved</h4>
          <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
            {transaction.transaction.message.accountKeys.map(
              (account, index) => (
                <div
                  key={index}
                  className="text-xs mb-1 flex items-center gap-1"
                >
                  <span className="truncate">{account.pubkey.toString()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => copyToClipboard(account.pubkey.toString())}
                  >
                    <Copy size={10} />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">
            Instructions ({instructions.length})
          </h4>
          <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
            {instructions.map((instruction, index) => (
              <div
                key={index}
                className="text-xs mb-2 pb-2 border-b border-gray-200"
              >
                <p className="font-medium">Instruction {index + 1}</p>
                {instruction.programId && (
                  <p className="mt-1">
                    Program:{" "}
                    <span className="font-mono">
                      {instruction.programId.toString()}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={fetchTransactionDetails}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh
        </Button>
        <a
          href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="flex items-center gap-2">
            <ExternalLink size={16} /> View on Explorer
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
};
