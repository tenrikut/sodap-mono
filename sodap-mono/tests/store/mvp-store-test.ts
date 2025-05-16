// @ts-nocheck
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

describe("Store MVP Tests", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Sodap as Program<Sodap>;

  // Test accounts
  const storeOwner = Keypair.generate();
  const storeManager = Keypair.generate();
  const storeViewer = Keypair.generate();

  // Store PDAs
  let storePda: PublicKey;
  let escrowPda: PublicKey;

  // Helper function to request an airdrop
  async function requestAirdrop(publicKey: PublicKey) {
    const signature = await provider.connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  }

  before(async () => {
    // Fund test accounts
    await requestAirdrop(storeOwner.publicKey);
    await requestAirdrop(storeManager.publicKey);
    await requestAirdrop(storeViewer.publicKey);

    // Find PDAs
    [storePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), storeOwner.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePda.toBuffer()],
      program.programId
    );
  });

  it("registers a new store", async () => {
    const storeTx = await program.methods
      .registerStore(
        "MVP Store",
        "Basic test store",
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

    assert(storeTx, "Failed to register store");

    // Verify store data
    const storeAccount = await program.account.store.fetch(storePda);
    assert.equal(storeAccount.name, "MVP Store");
    assert.equal(
      storeAccount.owner.toString(),
      storeOwner.publicKey.toString()
    );
    assert.isTrue(storeAccount.isActive);
  });

  it("updates store information", async () => {
    const updateTx = await program.methods
      .updateStore(
        "Updated Store",
        "Updated store description",
        "https://example.com/new-logo.png",
        {
          pointsPerDollar: new BN(20), // Updated value
          minimumPurchase: new BN(200), // Updated value
          rewardPercentage: new BN(10), // Updated value
          isActive: true,
        }
      )
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    assert(updateTx, "Failed to update store");

    // Verify updated store data
    const storeAccount = await program.account.store.fetch(storePda);
    assert.equal(storeAccount.name, "Updated Store");
    assert.equal(storeAccount.description, "Updated store description");
    assert.equal(storeAccount.loyaltyConfig.pointsPerDollar.toNumber(), 20);
  });

  it("adds a store admin", async () => {
    const addAdminTx = await program.methods
      .addStoreAdmin(storeManager.publicKey, { manager: {} }) // Using Manager role
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    const storeAccount = await program.account.store.fetch(storePda);
    const managerRole = storeAccount.adminRoles.find(
      (role) =>
        role.adminPubkey.toString() === storeManager.publicKey.toString()
    );
    assert(managerRole, "Manager role not found");
    assert.equal(managerRole.roleType.manager, {}, "Incorrect role type");
  });

  it("adds a store viewer", async () => {
    const addViewerTx = await program.methods
      .addStoreAdmin(storeViewer.publicKey, { viewer: {} })
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    const storeAccount = await program.account.store.fetch(storePda);
    const viewerRole = storeAccount.adminRoles.find(
      (role) => role.adminPubkey.toString() === storeViewer.publicKey.toString()
    );
    assert(viewerRole, "Viewer role not found");
    assert.equal(viewerRole.roleType.viewer, {}, "Incorrect role type");
  });

  it("validates admin role permissions", async () => {
    // Viewer should not be able to update store
    try {
      await program.methods
        .updateStore(
          "Unauthorized Update",
          "Should fail",
          "https://example.com/fail.png",
          {
            pointsPerDollar: new BN(5),
            minimumPurchase: new BN(100),
            rewardPercentage: new BN(5),
            isActive: true,
          }
        )
        .accounts({
          store: storePda,
          authority: storeViewer.publicKey,
        })
        .signers([storeViewer])
        .rpc();
      assert.fail("Should not allow viewer to update store");
    } catch (error) {
      assert(error.toString().includes("Unauthorized"));
    }
  });

  it("deactivates and reactivates store", async () => {
    // Deactivate store
    await program.methods
      .updateStore(
        "Updated Store",
        "Updated store description",
        "https://example.com/new-logo.png",
        {
          pointsPerDollar: new BN(20),
          minimumPurchase: new BN(200),
          rewardPercentage: new BN(10),
          isActive: false, // Deactivate the store
        }
      )
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    let storeAccount = await program.account.store.fetch(storePda);
    assert.isFalse(storeAccount.isActive, "Store should be inactive");

    // Reactivate store
    await program.methods
      .updateStore(
        "Updated Store",
        "Updated store description",
        "https://example.com/new-logo.png",
        {
          pointsPerDollar: new BN(20),
          minimumPurchase: new BN(200),
          rewardPercentage: new BN(10),
          isActive: true, // Reactivate the store
        }
      )
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    storeAccount = await program.account.store.fetch(storePda);
    assert.isTrue(storeAccount.isActive, "Store should be active");
  });

  it("removes a store admin", async () => {
    await program.methods
      .removeStoreAdmin(storeViewer.publicKey)
      .accounts({
        store: storePda,
        authority: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    const storeAccount = await program.account.store.fetch(storePda);
    const viewerRole = storeAccount.adminRoles.find(
      (role) => role.adminPubkey.toString() === storeViewer.publicKey.toString()
    );
    assert(!viewerRole, "Viewer role should have been removed");
  });

  it("validates loyalty config constraints", async () => {
    try {
      await program.methods
        .updateStore(
          "Updated Store",
          "Updated store description",
          "https://example.com/new-logo.png",
          {
            pointsPerDollar: new BN(0), // Invalid value
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
      assert.fail("Should not allow invalid loyalty config");
    } catch (error) {
      assert(error.toString().includes("Invalid loyalty configuration"));
    }
  });
});
