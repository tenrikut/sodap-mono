import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Sodap } from "../../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import { assert } from "chai";

describe("SODAP MVP Tests", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Test accounts
  const storeOwner = Keypair.generate();
  const storeManager = Keypair.generate();
  const customer = Keypair.generate();
  const platformAdmin = Keypair.generate();

  // Store PDAs
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  let userProfilePda: PublicKey;
  let productPda: PublicKey;

  // Test data
  const productUuid = new Array(16).fill(0);
  const productPrice = new BN(LAMPORTS_PER_SOL); // 1 SOL

  async function requestAirdrop(publicKey: PublicKey) {
    const signature = await provider.connection.requestAirdrop(
      publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  }

  before(async () => {
    // Fund test accounts
    await requestAirdrop(storeOwner.publicKey);
    await requestAirdrop(storeManager.publicKey);
    await requestAirdrop(customer.publicKey);
    await requestAirdrop(platformAdmin.publicKey);

    // Find PDAs
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );

    [userProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), customer.publicKey.toBuffer()],
      program.programId
    );

    [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), storePda.toBuffer(), Buffer.from(productUuid)],
      program.programId
    );
  });

  describe("1. Store Management", () => {
    it("registers a new store", async () => {
      const tx = await program.methods
        .registerStore(
          "MVP Store",
          "Test store description",
          "https://example.com/logo.png",
          {
            pointsPerDollar: new BN(10),
            minimumPurchase: new BN(100),
            rewardPercentage: new BN(5),
            isActive: true,
          }
        )
        .accounts({
          store: storePda,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();

      const store = await program.account.store.fetch(storePda);
      assert.equal(store.name, "MVP Store");
      assert.equal(store.owner.toString(), storeOwner.publicKey.toString());
    });

    it("updates store information", async () => {
      const tx = await program.methods
        .updateStore(
          "Updated Store",
          "Updated description",
          "https://example.com/new-logo.png",
          {
            pointsPerDollar: new BN(20),
            minimumPurchase: new BN(200),
            rewardPercentage: new BN(10),
            isActive: true,
          }
        )
        .accounts({
          store: storePda,
          authority: storeOwner.publicKey,
        })
        .signers([storeOwner])
        .rpc();

      const store = await program.account.store.fetch(storePda);
      assert.equal(store.name, "Updated Store");
      assert.equal(store.loyaltyConfig.pointsPerDollar.toNumber(), 20);
    });

    it("adds a store manager", async () => {
      const tx = await program.methods
        .addStoreAdmin(storeManager.publicKey, { manager: {} })
        .accounts({
          store: storePda,
          authority: storeOwner.publicKey,
        })
        .signers([storeOwner])
        .rpc();

      const store = await program.account.store.fetch(storePda);
      assert.isTrue(
        store.admins.some(
          (admin) =>
            admin.pubkey.toString() === storeManager.publicKey.toString()
        )
      );
    });
  });

  describe("2. Product Management", () => {
    it("registers a new product", async () => {
      const tx = await program.methods
        .registerProduct(
          productUuid,
          productPrice,
          new BN(100), // stock
          { nonTokenized: {} }, // product type
          "Test Product",
          "https://example.com/product.json"
        )
        .accounts({
          store: storePda,
          product: productPda,
          authority: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();

      const product = await program.account.product.fetch(productPda);
      assert.equal(product.price.toString(), productPrice.toString());
      assert.equal(product.stock.toNumber(), 100);
    });

    it("updates product information", async () => {
      const newPrice = productPrice.mul(new BN(2));
      const tx = await program.methods
        .updateProduct(
          productUuid,
          newPrice,
          new BN(50), // updated stock
          "Updated Product",
          "https://example.com/updated-product.json"
        )
        .accounts({
          store: storePda,
          product: productPda,
          authority: storeOwner.publicKey,
        })
        .signers([storeOwner])
        .rpc();

      const product = await program.account.product.fetch(productPda);
      assert.equal(product.price.toString(), newPrice.toString());
      assert.equal(product.stock.toNumber(), 50);
    });
  });

  describe("3. User Management", () => {
    it("creates a user profile", async () => {
      const tx = await program.methods
        .createUserWallet()
        .accounts({
          userProfile: userProfilePda,
          authority: customer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([customer])
        .rpc();

      const profile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(profile.authority.toString(), customer.publicKey.toString());
    });

    it("updates user profile", async () => {
      const tx = await program.methods
        .updateUserProfile("Test User", "123 Test Street", storePda)
        .accounts({
          userProfile: userProfilePda,
          authority: customer.publicKey,
        })
        .signers([customer])
        .rpc();

      const profile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(profile.preferredStore.toString(), storePda.toString());
    });
  });

  describe("4. Purchase Flow", () => {
    it("processes a purchase", async () => {
      // First get initial balances
      const initialCustomerBalance = await provider.connection.getBalance(
        customer.publicKey
      );
      const initialStoreBalance = await provider.connection.getBalance(
        storeOwner.publicKey
      );

      const tx = await program.methods
        .purchaseCart([productUuid], [new BN(1)], storePda)
        .accounts({
          store: storePda,
          escrowAccount: escrowPda,
          buyer: customer.publicKey,
          storeOwner: storeOwner.publicKey,
          receipt: Keypair.generate().publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([customer])
        .rpc();

      // Verify balances
      const finalCustomerBalance = await provider.connection.getBalance(
        customer.publicKey
      );
      const finalStoreBalance = await provider.connection.getBalance(
        storeOwner.publicKey
      );

      assert.isTrue(finalCustomerBalance < initialCustomerBalance);
      assert.isTrue(finalStoreBalance > initialStoreBalance);

      // Verify product stock was decreased
      const product = await program.account.product.fetch(productPda);
      assert.equal(product.stock.toNumber(), 49); // Previous 50 - 1
    });
  });

  describe("5. Admin Operations", () => {
    it("adds a platform admin", async () => {
      const adminTag = new Array(15).fill(0);
      const [platformAdminsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("platform_admins"), Buffer.from(adminTag)],
        program.programId
      );

      const tx = await program.methods
        .addPlatformAdmin(platformAdmin.publicKey)
        .accounts({
          platformAdmins: platformAdminsPda,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const adminsAccount = await program.account.platformAdmins.fetch(
        platformAdminsPda
      );
      assert.isTrue(
        adminsAccount.admins.some(
          (admin) => admin.toString() === platformAdmin.publicKey.toString()
        )
      );
    });
  });
});
