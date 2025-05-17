import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";
import { findProductPDA, findStorePDA } from "../../utils/pda-helpers";
import { v4 as uuidv4 } from "uuid";

function uuidToBytes(uuid: string): number[] {
  const hex = uuid.replace(/-/g, "");
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

describe("SODAP Product Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  let storeOwner: Keypair;
  let storePDA: PublicKey;
  let productUuid: number[];
  let productPDA: PublicKey;

  before(async () => {
    storeOwner = Keypair.generate();
    // Airdrop SOL to store owner
    const signature = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Setup store first
    [storePDA] = findStorePDA(program.programId, storeOwner.publicKey);
    const name = "Test Store";
    const description = "A test store for SODAP platform";
    const logoUri = "https://example.com/logo.png";
    const loyaltyConfig = {
      pointsPerDollar: new anchor.BN(10),
      minimumPurchase: new anchor.BN(100),
      rewardPercentage: new anchor.BN(5),
      isActive: true,
    };

    await program.methods
      .registerStore(name, description, logoUri, loyaltyConfig)
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();
  });

  it("should register a new product", async () => {
    // Generate UUID bytes for product
    productUuid = uuidToBytes(uuidv4());
    [productPDA] = findProductPDA(
      program.programId,
      storePDA,
      Buffer.from(productUuid)
    );

    const price = new anchor.BN(1_000_000); // 1 SOL
    const stock = new anchor.BN(100);
    const tokenizedType = { physical: {} }; // Physical product
    const metadataUri = "https://example.com/product/metadata.json";

    await program.methods
      .registerProduct(productUuid, price, stock, tokenizedType, metadataUri)
      .accounts({
        store: storePDA,
        product: productPDA,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify product data
    const productAccount = await program.account.product.fetch(productPDA);
    assert.ok(productAccount.uuid.every((b, i) => b === productUuid[i]));
    assert.equal(productAccount.price.toNumber(), 1_000_000);
    assert.equal(productAccount.stock.toNumber(), 100);
    assert.deepEqual(productAccount.tokenizedType, tokenizedType);
    assert.isTrue(productAccount.isActive === 1);
    assert.equal(productAccount.store.toString(), storePDA.toString());
  });

  it("should update product details", async () => {
    const newPrice = new anchor.BN(1_500_000); // 1.5 SOL
    const newStock = new anchor.BN(50);
    const newMetadataUri = "https://example.com/product/updated-metadata.json";

    await program.methods
      .updateProduct(productUuid, newPrice, newStock, newMetadataUri)
      .accounts({
        store: storePDA,
        product: productPDA,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    // Verify updated product data
    const productAccount = await program.account.product.fetch(productPDA);
    assert.equal(productAccount.price.toNumber(), 1_500_000);
    assert.equal(productAccount.stock.toNumber(), 50);
  });

  it("should deactivate product", async () => {
    await program.methods
      .deactivateProduct(productUuid)
      .accounts({
        store: storePDA,
        product: productPDA,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    // Verify product is deactivated
    const productAccount = await program.account.product.fetch(productPDA);
    assert.isTrue(productAccount.isActive === 0);
  });

  it("should fail to update deactivated product", async () => {
    const newPrice = new anchor.BN(2_000_000);
    try {
      await program.methods
        .updateProduct(productUuid, newPrice, null, null)
        .accounts({
          store: storePDA,
          product: productPDA,
          authority: storeOwner.publicKey,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err) {
      assert.include(err.toString(), "Product is not active");
    }
  });
});
