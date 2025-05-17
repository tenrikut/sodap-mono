import { Program, AnchorProvider, setProvider, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionVersion,
} from "@solana/web3.js";
// Using relative path to fix the import issue
import { IDL, PROGRAM_ID as PROGRAM_ID_STRING } from "../idl/index";
import type { Sodap } from "../idl/index";

// Note: Program ID is now read from the IDL's address field in v0.30+
// Re-export PROGRAM_ID for PDA derivation
export const PROGRAM_ID = PROGRAM_ID_STRING;

// Add TypeScript declaration for Phantom wallet
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: (options?: {
          onlyIfTrusted?: boolean;
        }) => Promise<{ publicKey: PublicKey }>;
        disconnect: () => Promise<void>;
        signTransaction: <T extends Transaction | VersionedTransaction>(
          transaction: T
        ) => Promise<T>;
        signAllTransactions: <T extends Transaction | VersionedTransaction>(
          transactions: T[]
        ) => Promise<T[]>;
        isUnlocked: () => Promise<boolean>;
      };
    };
  }
}

/**
 * Create an Anchor provider with the given connection and wallet
 */
export const createAnchorProvider = (
  connection: Connection,
  wallet: Wallet
): AnchorProvider => {
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  return provider;
};

/**
 * Create a wallet object from a private key
 * Only for testing - do not use in production
 */
export const createTestWallet = (privateKey?: Uint8Array): Wallet => {
  let keypair: Keypair;

  if (privateKey) {
    keypair = Keypair.fromSecretKey(privateKey);
  } else {
    // Demo mode - generate a random keypair
    keypair = Keypair.generate();
  }

  // Create a wallet adapter that implements the Wallet interface
  const wallet: Wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.partialSign(keypair);
      }
      return tx;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> => {
      return txs.map((tx) => {
        if (tx instanceof Transaction) {
          tx.partialSign(keypair);
        }
        return tx;
      });
    },
    // Add payer getter to satisfy the Wallet interface
    get payer() {
      return keypair;
    },
  };

  return wallet;
};

/**
 * Create an Anchor program instance
 */
export const createAnchorProgram = (provider: AnchorProvider): Program<Sodap> => {
  try {
    if (!provider) {
      throw new Error("Provider is null or undefined");
    }

    console.log("Creating Anchor program with IDL");
    console.log("- Provider connection:", provider.connection.rpcEndpoint);
    console.log("- Provider wallet public key:", provider.wallet.publicKey.toString());

    // In Anchor v0.30+, we need to:
    // 1. Set the provider globally
    setProvider(provider);

    // 2. Create program using only the IDL (which must include the address field)
    // Create program using simplified v0.30+ constructor
    // Note: IDL must include the program address
    const program = new Program<Sodap>(IDL);

    // Verify the program was created properly
    if (!program || !program.programId) {
      throw new Error("Program creation failed - program or programId is null");
    }

    console.log("Program created successfully with ID:", program.programId.toString());
    return program;
  } catch (error) {
    console.error("Error creating Anchor program:", error);
    throw new Error(
      `Failed to initialize program: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Creates a phantom wallet adapter for Anchor
 */
export const createPhantomWalletAdapter = (publicKey: PublicKey): Wallet => {
  if (!window.phantom?.solana) {
    throw new Error("Phantom wallet not available");
  }

  // Create a keypair that will be associated with the public key for payer
  const dummyKeypair = Keypair.generate();
  Object.defineProperty(dummyKeypair, "publicKey", {
    get: () => publicKey,
  });

  const wallet: Wallet = {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> => {
      try {
        const signedTx = await window.phantom.solana.signTransaction(tx);
        if (!signedTx) {
          throw new Error("Failed to sign transaction");
        }
        return signedTx as T;
      } catch (error) {
        console.error("Error signing transaction:", error);
        throw error;
      }
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> => {
      try {
        const signedTxs = await window.phantom.solana.signAllTransactions(txs);
        if (!signedTxs || signedTxs.length !== txs.length) {
          throw new Error("Failed to sign all transactions");
        }
        return signedTxs as T[];
      } catch (error) {
        console.error("Error signing transactions:", error);
        throw error;
      }
    },
    get payer() {
      return dummyKeypair;
    },
  };

  return wallet;
};
