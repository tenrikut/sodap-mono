import { AnchorProvider, Wallet, Program, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { PROGRAM_ID as PROGRAM_ID_STRING, IDL } from "../idl";
import type { Sodap } from "../idl/sodap";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

// Program ID from the Anchor.toml file - MUST match what's in the Rust code
export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

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
 * Create a safe IDL that won't cause "Cannot read properties of undefined" errors
 */
const createSafeIdl = (): Idl => {
  try {
    // Create a minimal valid IDL structure with all required properties
    const safeIdl = {
      version: "0.1.0",
      name: "sodap",
      address: PROGRAM_ID.toString(),
      metadata: IDL.metadata || { name: "sodap", version: "0.1.0" },
      instructions: (IDL.instructions || []).map(instruction => ({
        name: instruction.name || '',
        discriminator: instruction.discriminator || [],
        accounts: (instruction.accounts || []).map(account => ({
          name: account.name || '',
          isMut: Boolean(account.writable),  // Convert writable to isMut
          isSigner: Boolean(account.signer),  // Convert signer to isSigner
          isOptional: false
        })),
        args: (instruction.args || []).map(arg => ({
          name: arg.name || '',
          type: arg.type || 'u8'
        }))
      })),
      accounts: [],
      types: [],
      events: [],
      errors: []
    };

    console.log("Created safe IDL with", safeIdl.instructions.length, "instructions");
    return safeIdl as Idl;
  } catch (error) {
    console.error("Error creating safe IDL:", error);
    // Return minimal valid IDL if there's an error
    return {
      version: "0.1.0",
      name: "sodap",
      address: PROGRAM_ID.toString(),
      metadata: { name: "sodap", version: "0.1.0" },
      instructions: [],
      accounts: [],
      types: [],
      events: [],
      errors: []
    };
  }
};

/**
 * Create an Anchor program with the given provider
 * This uses a safe IDL structure to avoid "Cannot read properties of undefined" errors
 */
export const createAnchorProgram = (
  provider: AnchorProvider
): Program<Sodap> => {
  if (!provider) {
    throw new Error("Provider is required");
  }

  try {
    // Create a safe IDL
    const safeIdl = createSafeIdl();
    
    // Make sure provider is an AnchorProvider instance before passing to Program
    if (!(provider instanceof AnchorProvider)) {
      throw new Error("Provider must be an instance of AnchorProvider");
    }
    
    // Create the program with the safe IDL
    return new Program<Sodap>(safeIdl, PROGRAM_ID, provider);
  } catch (error) {
    console.error("Error creating Anchor program:", error);
    throw error;
  }
};

/**
 * Creates a phantom wallet adapter for Anchor
 * This properly implements the Wallet interface required by Anchor
 */
export const createPhantomWalletAdapter = (
  publicKey: PublicKey,
  signTx?: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>,
  signAllTxs?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
): Wallet => {
  // Create a keypair that will be associated with the public key for payer
  const dummyKeypair = Keypair.generate();
  
  // Ensure we have valid sign functions or fallbacks
  Object.defineProperty(dummyKeypair, "publicKey", {
    get: () => publicKey,
  });

  // Create the wallet object with typed methods
  const walletAdapter: Wallet = {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      // Use provided signTransaction function if available
      if (signTx) {
        return await signTx(tx);
      }
      // Fall back to window.phantom?.solana for signTransaction if no function provided
      if (!window.phantom?.solana) {
        throw new Error("No signTransaction function provided and Phantom wallet not available");
      }
      return window.phantom.solana.signTransaction(tx) as Promise<T>;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      // Use provided signAllTransactions function if available
      if (signAllTxs) {
        return await signAllTxs(txs);
      }
      // Fall back to window.phantom?.solana for signAllTransactions if no function provided
      if (!window.phantom?.solana) {
        throw new Error("No signAllTransactions function provided and Phantom wallet not available");
      }
      return window.phantom.solana.signAllTransactions(txs) as Promise<T[]>;
    },
    // The payer property is required by Anchor Provider
    get payer() {
      return dummyKeypair;
    },
  };

  return walletAdapter;
};

/**
 * Hook to use the Sodap program in React components
 * This will properly handle wallet connection and program initialization
 */
export function useSodapProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Sodap> | null>(null);

  useEffect(() => {
    if (wallet?.publicKey && connection) {
      try {
        // Convert wallet-adapter wallet to Anchor wallet
        const anchorWallet = createPhantomWalletAdapter(
          wallet.publicKey,
          wallet.signTransaction,
          wallet.signAllTransactions
        );

        // Create Anchor provider and program
        const provider = createAnchorProvider(connection, anchorWallet);
        const program = createAnchorProgram(provider);
        
        setProgram(program);
      } catch (error) {
        console.error("Error initializing Sodap program:", error);
      }
    } else {
      setProgram(null);
    }
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  return program;
}
