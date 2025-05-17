export type TransactionStatus = {
  pending?: Record<string, never>;
  completed?: Record<string, never>;
  failed?: Record<string, never>;
  refunded?: Record<string, never>;
};
