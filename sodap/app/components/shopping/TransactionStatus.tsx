import { FC } from "react";
import { TransactionStatus as TxStatus } from "../../hooks/useTransactionStatus";

interface TransactionStatusProps {
  status: TxStatus;
  signature: string;
  error?: string;
}

export const TransactionStatus: FC<TransactionStatusProps> = ({
  status,
  signature,
  error,
}) => {
  const statusColors = {
    pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
    confirmed: "text-green-600 bg-green-50 border-green-200",
    failed: "text-red-600 bg-red-50 border-red-200",
  };

  const statusMessages = {
    pending: "Transaction in progress...",
    confirmed: "Transaction confirmed!",
    failed: "Transaction failed",
  };

  return (
    <div className={`p-4 border rounded-lg ${statusColors[status]}`}>
      <div className="flex items-center mb-2">
        {status === "pending" && (
          <svg
            className="animate-spin h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {status === "confirmed" && (
          <svg
            className="h-5 w-5 mr-2"
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
        )}
        {status === "failed" && (
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="font-medium">{statusMessages[status]}</span>
      </div>

      <div className="text-sm space-y-1">
        <div className="font-mono break-all">
          <span className="opacity-75">Signature: </span>
          {signature.slice(0, 8)}...{signature.slice(-8)}
        </div>
        {error && <div className="text-red-600">{error}</div>}
      </div>
    </div>
  );
};
