import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import * as borsh from "borsh";

// Program ID for the SoDap program
const PROGRAM_ID = new PublicKey(
  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"
);

// Class for serializing purchase data
class PurchaseData {
  productIds: PublicKey[];
  quantities: number[];
  totalAmount: bigint;

  constructor(
    productIds: PublicKey[],
    quantities: number[],
    totalAmount: bigint
  ) {
    this.productIds = productIds;
    this.quantities = quantities;
    this.totalAmount = totalAmount;
  }

  static schema = new Map([
    [
      PurchaseData,
      {
        kind: "struct",
        fields: [
          ["productIds", [PublicKey]],
          ["quantities", ["u64"]],
          ["totalAmount", "u64"],
        ],
      },
    ],
  ]);
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { buyer, store, products, amount } = body;

    if (!buyer || !store || !products || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate inputs
    const buyerPublicKey = new PublicKey(buyer);
    const storePublicKey = new PublicKey(store);

    const productIds = products.map((p: any) => new PublicKey(p.id));
    const quantities = products.map((p: any) => p.quantity);

    // Connect to Solana network
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction({
      feePayer: buyerPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    // Find escrow account PDA
    const [escrowAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePublicKey.toBuffer()],
      PROGRAM_ID
    );

    // Find receipt account (to store purchase details)
    const receiptSeed = Math.random().toString();
    const [receiptAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), Buffer.from(receiptSeed)],
      PROGRAM_ID
    );

    // Serialize purchase data for instruction
    const purchaseData = new PurchaseData(
      productIds,
      quantities,
      BigInt(amount)
    );

    // Add purchase_cart instruction
    const purchaseInstruction = new TransactionInstruction({
      keys: [
        { pubkey: storePublicKey, isSigner: false, isWritable: true },
        { pubkey: receiptAccountPda, isSigner: false, isWritable: true },
        { pubkey: buyerPublicKey, isSigner: true, isWritable: true },
        { pubkey: storePublicKey, isSigner: false, isWritable: true }, // Store owner key
        { pubkey: escrowAccountPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([
        0x09,
        ...borsh.serialize(PurchaseData.schema, purchaseData),
      ]),
    });

    transaction.add(purchaseInstruction);

    // Serialize and return transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json({
      transaction: serializedTransaction.toString("base64"),
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
