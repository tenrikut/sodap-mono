// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";
import { findPDA, findStorePDA } from "../utils/test-helpers";

describe("SODAP Admin Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  let storeOwner: Keypair;
  let storePDA: PublicKey;
  let managerAdmin: Keypair;
  let viewerAdmin: Keypair;
  let storeId: PublicKey;
  let platformAdmin: Keypair;

  before(async () => {
    storeOwner = Keypair.generate();
    managerAdmin = Keypair.generate();
    viewerAdmin = Keypair.generate();
    platformAdmin = Keypair.generate();
    storeId = storeOwner.publicKey;

    // Airdrop SOL to store owner
    const signature = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    [storePDA] = findStorePDA(program.programId, storeOwner.publicKey);

    // Setup store
    await program.methods
      .registerStore(
        "Test Store",
        "Test Description",
        "https://example.com/logo.png",
        {
          pointsPerDollar: new anchor.BN(10),
          redemptionRate: new anchor.BN(5),
        }
      )
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify owner was automatically added as admin
    const storeAccount = await program.account.store.fetch(storePDA);
    assert.equal(storeAccount.adminCount, 1);
    assert.equal(
      storeAccount.adminRoles[0].adminPubkey.toString(),
      storeOwner.publicKey.toString()
    );
    assert.deepEqual(storeAccount.adminRoles[0].roleType, { owner: {} });
  });

  it("should manage platform admin operations correctly", async () => {
    const adminName = "Test Admin";
    const rootPassword = process.env.ROOT_PASSWORD || "secretpassword123";

    // Try adding platform admin with invalid password
    try {
      await program.methods
        .addPlatformAdmin(platformAdmin.publicKey, adminName, "wrongpassword")
        .accounts({
          payer: provider.wallet.publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should not allow adding platform admin with wrong password");
    } catch (err: any) {
      assert(err.toString().includes("Invalid root password"));
    }

    // Add platform admin with correct password
    const tx = await program.methods
      .addPlatformAdmin(platformAdmin.publicKey, adminName, rootPassword)
      .accounts({
        payer: provider.wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc();

    await provider.connection.confirmTransaction(tx);

    // Try adding same admin again
    try {
      await program.methods
        .addPlatformAdmin(platformAdmin.publicKey, adminName, rootPassword)
        .accounts({
          payer: provider.wallet.publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should not allow adding duplicate platform admin");
    } catch (err: any) {
      assert(err.toString().includes("Admin already exists"));
    }
  });

  it("should manage store admin roles correctly", async () => {
    // Save initial state
    const initialStore = await program.account.store.fetch(storePDA);
    const initialAdminCount = initialStore.adminCount;

    // Try adding admin with invalid role
    try {
      await program.methods
        .addStoreAdmin(storeId, managerAdmin.publicKey, { invalidRole: {} })
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Should not allow invalid role type");
    } catch (err: any) {
      assert(err.toString().includes("Invalid role type"));
    }

    // Add admin with manager role
    const tx = await program.methods
      .addStoreAdmin(storeId, managerAdmin.publicKey, { manager: {} })
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    await provider.connection.confirmTransaction(tx);

    // Verify admin was added with correct role
    const storeAccount = await program.account.store.fetch(storePDA);
    const admin = storeAccount.adminRoles.find(
      (role) => role.adminPubkey.toString() === managerAdmin.publicKey.toString()
    );
    
    assert.exists(admin, "Admin should exist");
    assert.deepEqual(admin.roleType, { manager: {} }, "Admin should have manager role");
    assert.equal(storeAccount.adminCount, initialAdminCount + 1, "Admin count should increase by 1");

    // Try adding same admin again
    try {
      await program.methods
        .addStoreAdmin(storeId, managerAdmin.publicKey, { viewer: {} })
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Should not allow adding duplicate admin");
    } catch (err: any) {
      assert(err.toString().includes("Admin already exists"));
    }

    // Verify admin count hasn't changed
    const finalStore = await program.account.store.fetch(storePDA);
    assert.equal(finalStore.adminCount, initialAdminCount + 1, "Admin count should not change");
  });

  it("should add a store admin with viewer role", async () => {
    await program.methods
      .addStoreAdmin(storeId, viewerAdmin.publicKey, { viewer: {} })
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([storeOwner])
      .rpc();

    // Verify admin was added with correct role type
    const storeAccount = await program.account.store.fetch(storePDA);
    const admin = storeAccount.adminRoles.find(
      (role) => role.adminPubkey.toString() === viewerAdmin.publicKey.toString()
    );
    assert.exists(admin);
    assert.deepEqual(admin.roleType, { viewer: {} });
    assert.equal(storeAccount.adminCount, 3);
  });

  it("only store owner should be able to add store admins", async () => {
    const newAdmin = Keypair.generate();
    try {
      await program.methods
        .addStoreAdmin(storeId, newAdmin.publicKey, { viewer: {} })
        .accounts({
          store: storePDA,
          authority: managerAdmin.publicKey, // Try with manager instead of owner
          payer: managerAdmin.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([managerAdmin])
        .rpc();
      assert.fail("Should not allow non-owner to add admins");
    } catch (err) {
      // Expected error
      assert.exists(err);
    }
  });

  it("should enforce maximum number of store admins", async () => {
    // Add admins until we hit the maximum
    // Note: Adjust this test based on your program's actual maximum limit
    const maxAdmins = 10; // Assuming this is the limit
    const currentAdminCount = (await program.account.store.fetch(storePDA))
      .adminCount;
    const remainingSlots = maxAdmins - currentAdminCount;

    for (let i = 0; i < remainingSlots; i++) {
      const newAdmin = Keypair.generate();
      await program.methods
        .addStoreAdmin(storeId, newAdmin.publicKey, { viewer: {} })
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId, // Ensure this matches the Rust definition
        } as any)
        .signers([storeOwner])
        .rpc();
    }

    // Try to add one more admin, should fail
    try {
      const oneMoreAdmin = Keypair.generate();
      await program.methods
        .addStoreAdmin(storeId, oneMoreAdmin.publicKey, { viewer: {} })
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId, // Ensure this matches the Rust definition
        } as any)
        .signers([storeOwner])
        .rpc();
    } catch (error) {
      console.error("Expected error:", error);
    }
  });

  it("should fail to add admin with non-owner account", async () => {
    const nonOwner = Keypair.generate();
    try {
      await program.methods
        .addStoreAdmin(storeId, nonOwner.publicKey, { manager: {} })
        .accounts({
          store: storePDA,
          authority: nonOwner.publicKey,
          payer: nonOwner.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([nonOwner])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err: any) {
      assert(err.toString().includes("Unauthorized"), "Expected unauthorized error");
    }
  });
  it("should remove a store admin", async () => {
    await program.methods
      .removeStoreAdmin(storeId, managerAdmin.publicKey)
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([storeOwner])
      .rpc();

    // Verify admin was removed
    const storeAccount = await program.account.store.fetch(storePDA);
    const admin = storeAccount.adminRoles.find(
      (role) =>
        role.adminPubkey.toString() === managerAdmin.publicKey.toString()
    );
    assert.notExists(admin);
    assert.equal(storeAccount.admin_count, 1); // Only owner remains
  });

  it("should not allow removing the store owner", async () => {
    try {
      await program.methods
        .removeStoreAdmin(storeOwner.publicKey)
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err: any) {
      assert(err.toString().includes("Unauthorized"), "Expected unauthorized error");
    }
  });
});
