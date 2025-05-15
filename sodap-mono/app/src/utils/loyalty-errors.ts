export class LoyaltyError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LoyaltyError';
  }
}

export const LOYALTY_ERRORS = {
  NOT_INITIALIZED: {
    code: 'LOYALTY_NOT_INITIALIZED',
    message: 'Loyalty program is not initialized for this store',
  },
  INSUFFICIENT_POINTS: {
    code: 'INSUFFICIENT_POINTS',
    message: 'Insufficient loyalty points for this redemption',
  },
  INVALID_AMOUNT: {
    code: 'INVALID_AMOUNT',
    message: 'Invalid points amount',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized to perform this action',
  },
} as const;

export const handleLoyaltyError = (error: unknown): LoyaltyError => {
  if (error instanceof LoyaltyError) {
    return error;
  }

  // Handle Anchor program errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  if (errorMessage.includes('Unauthorized')) {
    return new LoyaltyError(
      LOYALTY_ERRORS.UNAUTHORIZED.message,
      LOYALTY_ERRORS.UNAUTHORIZED.code
    );
  }

  if (errorMessage.includes('InsufficientLoyaltyPoints')) {
    return new LoyaltyError(
      LOYALTY_ERRORS.INSUFFICIENT_POINTS.message,
      LOYALTY_ERRORS.INSUFFICIENT_POINTS.code
    );
  }

  // Default error
  return new LoyaltyError(errorMessage, 'UNKNOWN_ERROR');
};
