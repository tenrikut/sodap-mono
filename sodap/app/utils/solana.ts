import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import { Product } from "@/types/sodap";
import BN from "bn.js";

// Define the program ID (replace with actual deployed program ID)
export const PROGRAM_ID = new PublicKey(
  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

// Utility for connecting to the Solana network
export async function getConnection() {
  return new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
  );
}

// Utility to convert a standard UUID to byte array for on-chain storage
export function uuidToBytes(uuid: string): Uint8Array {
  // Remove hyphens from UUID
  const hexString = uuid.replace(/-/g, "");

  // Convert hex string to byte array
  const byteArray = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    byteArray[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
  }

  return byteArray;
}

// Utility to convert byte array from on-chain storage to UUID string
export function bytesToUuid(bytes: Uint8Array): string {
  // Convert byte array to hex string
  let hexString = "";
  for (let i = 0; i < bytes.length; i++) {
    const hex = bytes[i].toString(16).padStart(2, "0");
    hexString += hex;
  }

  // Format as UUID
  return [
    hexString.substring(0, 8),
    hexString.substring(8, 12),
    hexString.substring(12, 16),
    hexString.substring(16, 20),
    hexString.substring(20, 32),
  ].join("-");
}

// Function to derive the product PDA address
export async function findProductAddress(
  productUuid: Uint8Array
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("product"), Buffer.from(productUuid)],
    PROGRAM_ID
  );
}

// Function to derive the store PDA address
export async function findStoreAddress(
  storeId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("store"), storeId.toBuffer()],
    PROGRAM_ID
  );
}

// Function to register a product on-chain
export async function registerProduct(
  program: Program,
  storeKeypair: web3.Keypair,
  productData: Omit<Product, "id">,
  productUuid: Uint8Array
): Promise<string> {
  try {
    // Convert price from SOL to lamports (1 SOL = 10^9 lamports)
    const priceInLamports = Math.floor(productData.price * 1_000_000_000);

    // Find the PDA for the product
    const [productPda, _] = await findProductAddress(productUuid);

    // Find the PDA for the store
    const storeId = storeKeypair.publicKey;
    const [storePda, __] = await findStoreAddress(storeId);

    // Call the smart contract to register the product
    const tx = await program.methods
      .registerProduct(
        productUuid,
        new BN(priceInLamports),
        new BN(productData.inventory),
        { none: {} }, // TokenizedType (None or SplToken)
        JSON.stringify({
          name: productData.name,
          description: productData.description,
          imageUrl: productData.imageUrl,
          category: productData.category,
        }) // Metadata URI - we're storing JSON directly in this example
      )
      .accounts({
        product: productPda,
        store: storeKeypair.publicKey,
        storeAccount: storePda,
        mint: web3.PublicKey.default, // Not using SPL tokens in this example
        tokenAccount: web3.PublicKey.default, // Not using SPL tokens in this example
        tokenProgram: web3.PublicKey.default, // Not using SPL tokens in this example
        associatedTokenProgram: web3.PublicKey.default, // Not using SPL tokens in this example
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([storeKeypair])
      .rpc();

    console.log("Transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error registering product:", error);
    throw error;
  }
}

// Function to update a product on-chain
export async function updateProduct(
  program: Program,
  storeKeypair: web3.Keypair,
  productUuid: Uint8Array,
  updates: Partial<Omit<Product, "id">>
): Promise<string> {
  try {
    // Find the PDA for the product
    const [productPda, _] = await findProductAddress(productUuid);

    // Find the PDA for the store
    const storeId = storeKeypair.publicKey;
    const [storePda, __] = await findStoreAddress(storeId);

    // Prepare update parameters
    const newPrice = updates.price
      ? new BN(Math.floor(updates.price * 1_000_000_000))
      : null;

    const newStock = updates.inventory ? new BN(updates.inventory) : null;

    let newMetadataUri = null;
    if (
      updates.name ||
      updates.description ||
      updates.imageUrl ||
      updates.category
    ) {
      // Fetch current product to merge with updates
      const productAccount = await program.account.product.fetch(productPda);
      const currentMetadata = JSON.parse(productAccount.metadataUri);

      const updatedMetadata = {
        name: updates.name || currentMetadata.name,
        description: updates.description || currentMetadata.description,
        imageUrl: updates.imageUrl || currentMetadata.imageUrl,
        category: updates.category || currentMetadata.category,
      };

      newMetadataUri = JSON.stringify(updatedMetadata);
    }

    // Call the smart contract to update the product
    const tx = await program.methods
      .updateProduct(
        productUuid,
        newPrice,
        newStock,
        newMetadataUri,
        null // No tokenized type update
      )
      .accounts({
        product: productPda,
        store: storeKeypair.publicKey,
        storeAccount: storePda,
      })
      .signers([storeKeypair])
      .rpc();

    console.log("Update transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Function to deactivate a product on-chain
export async function deactivateProduct(
  program: Program,
  storeKeypair: web3.Keypair,
  productUuid: Uint8Array
): Promise<string> {
  try {
    // Find the PDA for the product
    const [productPda, _] = await findProductAddress(productUuid);

    // Find the PDA for the store
    const storeId = storeKeypair.publicKey;
    const [storePda, __] = await findStoreAddress(storeId);

    // Call the smart contract to deactivate the product
    const tx = await program.methods
      .deactivateProduct(productUuid)
      .accounts({
        product: productPda,
        store: storeKeypair.publicKey,
        storeAccount: storePda,
      })
      .signers([storeKeypair])
      .rpc();

    console.log("Deactivate transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error deactivating product:", error);
    throw error;
  }
}

// Function to fetch a product from chain
export async function fetchProduct(
  program: Program,
  productUuid: Uint8Array
): Promise<Product> {
  try {
    // Find the PDA for the product
    const [productPda, _] = await findProductAddress(productUuid);

    // Fetch the product data from the blockchain
    const productAccount = await program.account.product.fetch(productPda);

    // Parse the metadata URI
    const metadata = JSON.parse(productAccount.metadataUri);

    // Create a Product object with all required attributes
    return {
      id: bytesToUuid(productAccount.productUuid),
      name: metadata.name,
      description: metadata.description,
      price: productAccount.price.toNumber() / 1_000_000_000, // Convert lamports to SOL
      inventory: productAccount.stock.toNumber(),
      imageUrl: metadata.imageUrl,
      category: metadata.category,
      tokenizedType: productAccount.tokenizedType.none ? "None" : "SplToken",
      isActive: !productAccount.deactivated,
      createdAt: productAccount.createdAt.toNumber() * 1000, // Convert to JS timestamp
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

// Function to derive the platform_admins PDA address
export async function findPlatformAdminsAddress(): Promise<
  [PublicKey, number]
> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform_admins")],
    PROGRAM_ID
  );
}

// Function to add a platform admin on-chain
export async function addPlatformAdminOnChain(
  program: Program,
  signer: web3.Keypair,
  newAdmin: PublicKey,
  username: string,
  password: string
): Promise<string> {
  try {
    const [platformAdminsPda, _] = await findPlatformAdminsAddress();
    const tx = await program.methods
      .addPlatformAdmin(newAdmin, username, password)
      .accounts({
        platformAdmins: platformAdminsPda,
        signer: signer.publicKey,
      })
      .signers([signer])
      .rpc();
    return tx;
  } catch (error) {
    console.error("Error adding platform admin:", error);
    throw error;
  }
}

// Function to remove a platform admin on-chain
export async function removePlatformAdminOnChain(
  program: Program,
  signer: web3.Keypair,
  adminPubkey: PublicKey,
  username: string,
  password: string
): Promise<string> {
  try {
    const [platformAdminsPda, _] = await findPlatformAdminsAddress();
    const tx = await program.methods
      .removePlatformAdmin(adminPubkey, username, password)
      .accounts({
        platformAdmins: platformAdminsPda,
        signer: signer.publicKey,
      })
      .signers([signer])
      .rpc();
    return tx;
  } catch (error) {
    console.error("Error removing platform admin:", error);
    throw error;
  }
}

// Function to fetch the current list of platform admins from chain
export async function fetchPlatformAdmins(
  program: Program
): Promise<PublicKey[]> {
  const [platformAdminsPda, _] = await findPlatformAdminsAddress();
  const account = await program.account.platformAdmins.fetch(platformAdminsPda);
  return account.admins;
}

// Function to register a store on-chain
export async function registerStoreOnChain(
  program: Program,
  owner: web3.Keypair,
  name: string,
  description: string,
  logoUri: string
): Promise<string> {
  try {
    // Use the owner's public key as the store_id
    const storeId = owner.publicKey;
    // Find the PDA for the store
    const [storePda, _] = await findStoreAddress(storeId);
    // Use a default loyalty config for now
    const loyaltyConfig = {
      pointsPerDollar: new BN(0),
      minimumPurchase: new BN(0),
      rewardPercentage: new BN(0),
      isActive: false,
    };
    const tx = await program.methods
      .registerStore(storeId, name, description, logoUri, loyaltyConfig)
      .accounts({
        store: storePda,
        owner: owner.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();
    return tx;
  } catch (error) {
    console.error("Error registering store:", error);
    throw error;
  }
}

// Function to fetch all stores from the chain
export async function fetchStores(program: Program): Promise<any[]> {
  try {
    const stores = await program.account.store.all();
    return stores.map((s: any) => ({
      storeId: s.publicKey.toBase58(),
      owner: s.account.owner.toBase58(),
      name: s.account.name,
      description: s.account.description,
      logoUri: s.account.logoUri,
      createdAt: s.account.createdAt.toNumber() * 1000,
    }));
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

// Function to add a store admin on-chain
export async function addStoreAdminOnChain(
  program: Program,
  owner: web3.Keypair,
  storeId: PublicKey,
  adminPubkey: PublicKey,
  roleType: string
): Promise<string> {
  try {
    // Map roleType string to Anchor enum
    let anchorRoleType;
    if (roleType === "Manager") {
      anchorRoleType = { manager: {} };
    } else if (roleType === "Cashier") {
      anchorRoleType = { cashier: {} };
    } else {
      throw new Error("Invalid role type");
    }
    // Find the PDA for the store
    const [storePda, _] = await findStoreAddress(storeId);
    const tx = await program.methods
      .addAdmin(storeId, adminPubkey, anchorRoleType)
      .accounts({
        store: storePda,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();
    return tx;
  } catch (error) {
    console.error("Error adding store admin:", error);
    throw error;
  }
}

// Utility to create a new Solana wallet (Keypair)
export function createNewWallet() {
  const keypair = web3.Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Array.from(keypair.secretKey),
    keypair,
  };
}

// Fetch recent confirmed signatures for your program
export async function fetchProgramSignatures(limit = 50) {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
  );
  // Get signatures for transactions involving your program
  const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
    limit,
  });
  return signatures.map((sig) => sig.signature);
}

// Fetch and parse logs for each transaction
export async function fetchAndParseProgramEvents(limit = 50) {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
  );
  const signatures = await fetchProgramSignatures(limit);

  const events: any[] = [];
  for (const signature of signatures) {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
    });
    if (!tx || !tx.meta || !tx.meta.logMessages) continue;

    // Parse Anchor events from log messages
    for (const log of tx.meta.logMessages) {
      // Anchor events are logged as: "Program log: EVENT_JSON"
      if (log.startsWith("Program log:")) {
        try {
          // Try to parse the JSON part (after "Program log: ")
          const eventStr = log.replace("Program log: ", "");
          // Only parse if it looks like a JSON object
          if (eventStr.startsWith("{") && eventStr.endsWith("}")) {
            const event = JSON.parse(eventStr);
            events.push({
              ...event,
              signature,
              slot: tx.slot,
              blockTime: tx.blockTime,
            });
          }
        } catch (e) {
          // Not a JSON event, skip
        }
      }
    }
  }
  return events;
}

export async function findEscrowAddress(
  storeId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), storeId.toBuffer()],
    PROGRAM_ID
  );
}

export async function findLoyaltyMintAddress(
  storeId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("loyalty_mint"), storeId.toBuffer()],
    PROGRAM_ID
  );
}

export async function processEscrowPayment(
  program: Program,
  buyer: web3.Keypair,
  storeId: PublicKey,
  amount: number
): Promise<string> {
  try {
    const [escrowPda] = await findEscrowAddress(storeId);
    const [storePda] = await findStoreAddress(storeId);

    const tx = await program.methods
      .purchaseCart(amount, 0, { pending: {} })
      .accounts({
        buyer: buyer.publicKey,
        store: storePda,
        escrowAccount: escrowPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error processing escrow payment:", error);
    throw error;
  }
}

export async function releaseEscrowPayment(
  program: Program,
  storeOwner: web3.Keypair,
  storeId: PublicKey,
  amount: number
): Promise<string> {
  try {
    const [escrowPda] = await findEscrowAddress(storeId);
    const [storePda] = await findStoreAddress(storeId);

    const tx = await program.methods
      .releaseEscrow(new BN(amount))
      .accounts({
        escrowAccount: escrowPda,
        store: storePda,
        storeOwner: storeOwner.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error releasing escrow payment:", error);
    throw error;
  }
}

export async function refundEscrowPayment(
  program: Program,
  storeOwner: web3.Keypair,
  buyer: PublicKey,
  storeId: PublicKey,
  amount: number
): Promise<string> {
  try {
    const [escrowPda] = await findEscrowAddress(storeId);
    const [storePda] = await findStoreAddress(storeId);

    const tx = await program.methods
      .refundFromEscrow(new BN(amount))
      .accounts({
        escrowAccount: escrowPda,
        store: storePda,
        buyer,
        storeOwner: storeOwner.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    return tx;
  } catch (error) {
    console.error("Error refunding escrow payment:", error);
    throw error;
  }
}
