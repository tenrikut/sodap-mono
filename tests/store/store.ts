import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { Sodap } from "../../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import { assert } from "chai";
import { describe, it } from "mocha";

type AdminRoleType = { owner: {} } | { manager: {} } | { viewer: {} };
type LoyaltyConfig = {
  pointsPerDollar: BN;
  redemptionRate: BN;
};

describe("Store Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Test accounts
  const storeOwner = Keypair.generate();
  const storeManager = Keypair.generate();
  const storeViewer = Keypair.generate();

  // PDAs
  let storePda: PublicKey;
  let escrowPda: PublicKey;
  let storeBump: number;
  let escrowBump: number;

  before(async () => {
    // Fund test accounts
    const fundAccounts = [
      storeOwner.publicKey,
      storeManager.publicKey,
      storeViewer.publicKey,
    ];

    for (const account of fundAccounts) {
      const sig = await provider.connection.requestAirdrop(
        account,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Find PDAs
    [storePda, storeBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda, escrowBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
  });

  it("registers a new store with valid data", async () => {
    const storeName = "Test Store";
    const storeDesc = "Basic test store";
    const logoUri = "https://test.com/logo.png";
    const loyaltyConfig = {
      pointsPerDollar: new BN(10),
      redemptionRate: new BN(5),
    };

    // Verify store doesn't exist before registration
    const storeAccountBefore = await provider.connection.getAccountInfo(storePda);
    assert.isNull(storeAccountBefore, "Store should not exist before registration");

    const tx = await program.methods
      .registerStore(
        storeName,
        storeDesc,
        logoUri,
        loyaltyConfig
      )
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify transaction was confirmed
    await provider.connection.confirmTransaction(tx);

    // Fetch and verify store data
    const store = await program.account.store.fetch(storePda);
    assert.equal(store.name, storeName, "Store name mismatch");
    assert.equal(store.description, storeDesc, "Store description mismatch");
    assert.equal(store.logoUri, logoUri, "Store logo URI mismatch");
    assert.equal(store.owner.toString(), storeOwner.publicKey.toString(), "Store owner mismatch");
    assert.isTrue(store.isActive, "Store should be active");
    assert.equal(store.adminCount, 1, "Store should have one admin (owner)");
    assert.equal(store.revenue.toNumber(), 0, "Initial revenue should be 0");
    
    // Verify loyalty config
    assert.equal(
      store.loyaltyConfig.pointsPerDollar.toNumber(),
      loyaltyConfig.pointsPerDollar.toNumber(),
      "Points per dollar mismatch"
    );
    assert.equal(
      store.loyaltyConfig.redemptionRate.toNumber(),
      loyaltyConfig.redemptionRate.toNumber(),
      "Redemption rate mismatch"
    );
  });

  it("updates store information with validation", async () => {
    // Save original store data for comparison
    const originalStore = await program.account.store.fetch(storePda);

    const updatedName = "Updated Store";
    const updatedDesc = "Updated store description";
    const updatedLogoUri = "https://test.com/updated-logo.png";
    const updatedConfig = {
      pointsPerDollar: new BN(20),
      redemptionRate: new BN(10),
    };

    // Try updating with invalid authority (non-owner)
    const nonOwner = Keypair.generate();
    try {
      await program.methods
        .updateStore(
          storePda,
          updatedName,
          updatedDesc,
          updatedLogoUri,
          updatedConfig
        )
        .accountsStrict({
          store: storePda,
          authority: nonOwner.publicKey,
          payer: nonOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonOwner])
        .rpc();
      assert.fail("Should not allow non-owner to update store");
    } catch (err: any) {
      assert(err.toString().includes("Unauthorized"));
    }

    // Update with valid owner
    const tx = await program.methods
      .updateStore(
        storePda,
        updatedName,
        updatedDesc,
        updatedLogoUri,
        updatedConfig
      )
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    await provider.connection.confirmTransaction(tx);

    // Verify updates
    const updatedStore = await program.account.store.fetch(storePda);
    assert.equal(updatedStore.name, updatedName, "Store name not updated");
    assert.equal(updatedStore.description, updatedDesc, "Store description not updated");
    assert.equal(updatedStore.logoUri, updatedLogoUri, "Store logo URI not updated");
    
    // Verify loyalty config updates
    assert.equal(
      updatedStore.loyaltyConfig.pointsPerDollar.toNumber(),
      updatedConfig.pointsPerDollar.toNumber(),
      "Points per dollar not updated"
    );
    assert.equal(
      updatedStore.loyaltyConfig.redemptionRate.toNumber(),
      updatedConfig.redemptionRate.toNumber(),
      "Redemption rate not updated"
    );

    // Verify unchanged fields remain the same
    assert.equal(
      updatedStore.owner.toString(),
      originalStore.owner.toString(),
      "Store owner should not change"
    );
    assert.equal(
      updatedStore.isActive,
      originalStore.isActive,
      "Store active status should not change"
    );
  });

  it("adds a store admin", async () => {
    const tx = await program.methods
      .addStoreAdmin(storePda, storeManager.publicKey, { manager: {} })
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    const store = await program.account.store.fetch(storePda);
    const managerRole = store.adminRoles.find(
      (role) =>
        role.adminPubkey.toString() === storeManager.publicKey.toString()
    );
    assert(managerRole, "Manager role not found");
    assert.deepEqual(managerRole.roleType, { manager: {} });
  });

  it("adds a store viewer", async () => {
    const tx = await program.methods
      .addStoreAdmin(storePda, storeViewer.publicKey, { viewer: {} })
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    const store = await program.account.store.fetch(storePda);
    const viewerRole = store.adminRoles.find(
      (role) => role.adminPubkey.toString() === storeViewer.publicKey.toString()
    );
    assert(viewerRole, "Viewer role not found");
    assert.deepEqual(viewerRole.roleType, { viewer: {} });
  });

  it("validates admin role permissions", async () => {
    try {
      await program.methods
        .updateStore(storePda, null, null, null, {
          pointsPerDollar: new BN(10),
          redemptionRate: new BN(5),
        })
        .accountsPartial({
          payer: storeViewer.publicKey,
        })
        .signers([storeViewer])
        .rpc();
      assert.fail("Should not allow viewer to update store");
    } catch (error) {
      const errorMsg = error.toString();
      assert(errorMsg.includes("has_one constraint was violated"));
    }
  });

  it("deactivates and reactivates store", async () => {
    // Deactivate store
    await program.methods
      .updateStore(
        storePda,
        "Test Store",
        "Basic test store",
        "https://test.com/logo.png",
        {
          pointsPerDollar: new BN(10),
          redemptionRate: new BN(5),
        }
      )
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    let store = await program.account.store.fetch(storePda);
    assert.isFalse(store.isActive, "Store should be inactive");

    // Reactivate store
    await program.methods
      .updateStore(storePda, null, null, null, {
        pointsPerDollar: new BN(10),
        redemptionRate: new BN(5),
      })
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    store = await program.account.store.fetch(storePda);
    assert.isTrue(store.isActive, "Store should be active");
  });

  it("removes a store admin", async () => {
    await program.methods
      .removeStoreAdmin(storePda, storeViewer.publicKey)
      .accountsStrict({
        store: storePda,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    const store = await program.account.store.fetch(storePda);
    const viewerRole = store.adminRoles.find(
      (role) => role.adminPubkey.toString() === storeViewer.publicKey.toString()
    );
    assert.isUndefined(viewerRole, "Viewer role should be removed");
  });

  it("validates loyalty config constraints", async () => {
    // Get the store PDA
    const [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    // Test points per dollar = 0
    try {
      await program.methods
        .updateStore(storePda, null, null, null, {
          pointsPerDollar: new BN(0),
          redemptionRate: new BN(5),
        })
        .accountsStrict({
          store: storePda,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Should not allow points per dollar to be 0");
    } catch (error: unknown) {
      const errorMsg = (error as Error).toString();
      assert(errorMsg.includes("Invalid loyalty configuration"));
    }

    // Test redemption rate = 0
    try {
      await program.methods
        .updateStore(storePda, null, null, null, {
          pointsPerDollar: new BN(10),
          redemptionRate: new BN(0),
        })
        .accountsStrict({
          store: storePda,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Should not allow redemption rate to be 0");
    } catch (error: unknown) {
      const errorMsg = (error as Error).toString();
      assert(errorMsg.includes("Invalid loyalty configuration"));
    }
  });

  it("enforces max admins limit", async () => {
    // Add maximum number of admins
    const maxAdmins = 10; // This should match Store::MAX_ADMINS in the program
    const admins = Array.from({ length: maxAdmins }, () => Keypair.generate());

    // Fund all admin accounts
    for (const admin of admins) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          admin.publicKey,
          LAMPORTS_PER_SOL
        )
      );
    }

    // Add admins until we reach the limit
    for (let i = 0; i < maxAdmins - 2; i++) {
      // -2 because owner and manager are already admins
      await program.methods
        .addStoreAdmin(storePda, admins[i].publicKey, { viewer: {} })
        .accountsStrict({
          store: storePda,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
    }

    // Try to add one more admin
    try {
      await program.methods
        .addStoreAdmin(storePda, Keypair.generate().publicKey, { viewer: {} })
        .accountsStrict({
          store: storePda,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Should not allow exceeding max admins");
    } catch (error: unknown) {
      const errorMsg = (error as Error).toString();
      assert(errorMsg.includes("MaxAdminsReached"));
    }
  });
  });
});
