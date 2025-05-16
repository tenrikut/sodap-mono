import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";
import { findStorePDA } from "../../utils/pda-helpers";

describe("SODAP Admin Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  let storeOwner: Keypair;
  let storePDA: PublicKey;
  let managerAdmin: Keypair;
  let viewerAdmin: Keypair;
  let storeId: PublicKey;

  before(async () => {
    storeOwner = Keypair.generate();
    managerAdmin = Keypair.generate();
    viewerAdmin = Keypair.generate();
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
          minimumPurchase: new anchor.BN(100),
          rewardPercentage: new anchor.BN(5),
          isActive: true,
        }
      )
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
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

  it("should add a store admin with manager role", async () => {
    await program.methods
      .addStoreAdmin(storeId, managerAdmin.publicKey, { manager: {} })
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey, // owner signer
        payer: storeOwner.publicKey, // pays for account creation
        system_program: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify admin was added
    const storeAccount = await program.account.store.fetch(storePDA);
    const admin = storeAccount.adminRoles.find(
      (role) =>
        role.adminPubkey.toString() === managerAdmin.publicKey.toString()
    );
    assert.exists(admin);
    assert.deepEqual(admin.roleType, { manager: {} });
  });

  it("should add a store admin with viewer role", async () => {
    await program.methods
      .addStoreAdmin(storeId, viewerAdmin.publicKey, { viewer: {} })
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey, // only owner can add admins
        payer: storeOwner.publicKey, // pays for account storage
        system_program: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify admin was added
    const storeAccount = await program.account.store.fetch(storePDA);
    const admin = storeAccount.adminRoles.find(
      (role) => role.adminPubkey.toString() === viewerAdmin.publicKey.toString()
    );
    assert.exists(admin);
    assert.deepEqual(admin.roleType, { viewer: {} });
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
      assert.include(err.toString(), "Unauthorized");
    }
  });

  it("should remove a store admin", async () => {
    await program.methods
      .removeStoreAdmin(storeId, managerAdmin.publicKey) // needs both storeId and adminPubkey
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify admin was removed
    const storeAccount = await program.account.store.fetch(storePDA);
    const admin = storeAccount.adminRoles.find(
      (role) =>
        role.adminPubkey.toString() === managerAdmin.publicKey.toString()
    );
    assert.notExists(admin);
    assert.equal(storeAccount.adminCount, 2); // owner + viewer admin
  });

  it("should not allow removing the store owner", async () => {
    try {
      await program.methods
        .removeStoreAdmin(storeId, storeOwner.publicKey) // attempt to remove owner
        .accounts({
          store: storePDA,
          authority: managerAdmin.publicKey,
          payer: managerAdmin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([managerAdmin])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err: any) {
      assert.include(err.toString(), "Cannot remove store owner");
    }
  });

  it("should allow partial store updates by manager admin", async () => {
    // Add manager admin first
    await program.methods
      .addStoreAdmin(storeId, managerAdmin.publicKey, { manager: {} })
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Update only store name
    await program.methods
      .updateStore(
        storeId,
        "Updated Name",
        null, // keep existing description
        null, // keep existing logo
        null // keep existing loyalty config
      )
      .accounts({
        store: storePDA,
        authority: managerAdmin.publicKey, // manager has update privileges
        system_program: SystemProgram.programId,
      })
      .signers([managerAdmin])
      .rpc();

    // Verify only name was updated
    const storeAccount = await program.account.store.fetch(storePDA);
    assert.equal(storeAccount.name, "Updated Name");
    assert.equal(storeAccount.description, "Test Description"); // Original value preserved
    assert.equal(storeAccount.logoUri, "https://example.com/logo.png"); // Original value preserved
  });

  it("should not allow viewer admin to update store", async () => {
    try {
      await program.methods
        .updateStore(storeId, "Viewer Update", null, null, null)
        .accounts({
          store: storePDA,
          authority: viewerAdmin.publicKey, // viewers can't update
          system_program: SystemProgram.programId,
        })
        .signers([viewerAdmin])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err: any) {
      assert.include(err.toString(), "Unauthorized");
    }
  });

  it("should not exceed max admin limit", async () => {
    // Add maximum number of admins
    const maxAdmins = 10;
    const newAdmins = Array.from({ length: maxAdmins }, () =>
      Keypair.generate()
    );

    // First remove existing admins
    await program.methods
      .removeStoreAdmin(managerAdmin.publicKey)
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    await program.methods
      .removeStoreAdmin(viewerAdmin.publicKey)
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Add max number of admins
    for (let i = 0; i < maxAdmins; i++) {
      await program.methods
        .addStoreAdmin(storeId, newAdmins[i].publicKey, { manager: {} })
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
    }

    // Try to add one more admin
    try {
      const extraAdmin = Keypair.generate();
      await program.methods
        .addStoreAdmin(storeId, extraAdmin.publicKey, { manager: {} })
        .accounts({
          store: storePDA,
          authority: storeOwner.publicKey,
          payer: storeOwner.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([storeOwner])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err: any) {
      assert.include(err.toString(), "Max admins reached");
    }
  });
});
