import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";
import {
  findEscrowPDA,
  findLoyaltyMintPDA,
  findStorePDA,
} from "../../utils/pda-helpers";

describe("SODAP Store Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  let storeOwner: Keypair;
  let storePDA: PublicKey;
  let escrowPDA: PublicKey;

  before(async () => {
    storeOwner = Keypair.generate();
    // Airdrop SOL to store owner
    const signature = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("should register a new store", async () => {
    // Find PDAs
    [storePDA] = findStorePDA(program.programId, storeOwner.publicKey);
    [escrowPDA] = findEscrowPDA(program.programId, storePDA);

    const name = "Test Store";
    const description = "A test store for SODAP platform";
    const logoUri = "https://example.com/logo.png";
    const loyaltyConfig = {
      pointsPerDollar: new anchor.BN(10),
      minimumPurchase: new anchor.BN(100),
      rewardPercentage: new anchor.BN(5),
      isActive: true,
    };

    // Register store
    await program.methods
      .registerStore(name, description, logoUri, loyaltyConfig)
      .accounts({
        store: storePDA,
        authority: storeOwner.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify store data
    const storeAccount = await program.account.store.fetch(storePDA);
    assert.equal(
      storeAccount.owner.toString(),
      storeOwner.publicKey.toString()
    );
    assert.equal(storeAccount.name, name);
    assert.equal(storeAccount.description, description);
    assert.equal(storeAccount.logoUri, logoUri);
    assert.equal(storeAccount.loyaltyConfig.pointsPerDollar.toNumber(), 10);
    assert.isTrue(storeAccount.isActive);
    assert.equal(storeAccount.revenue.toNumber(), 0);
  });

  it("should create store escrow account", async () => {
    // Create escrow account
    await program.methods
      .storeEscrow()
      .accounts({
        escrowAccount: escrowPDA,
        store: storePDA,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Verify escrow account
    const escrowAccount = await program.account.escrow.fetch(escrowPDA);
    assert.equal(escrowAccount.store.toString(), storePDA.toString());
    assert.equal(escrowAccount.balance.toNumber(), 0);
  });

  it("should update store details", async () => {
    const newName = "Updated Test Store";
    const newDescription = "Updated test store description";
    const newLogoUri = "https://example.com/new-logo.png";
    const newLoyaltyConfig = {
      pointsPerDollar: new anchor.BN(20),
      minimumPurchase: new anchor.BN(200),
      rewardPercentage: new anchor.BN(10),
      isActive: true,
    };

    await program.methods
      .updateStore(
        storePDA,
        newName,
        newDescription,
        newLogoUri,
        newLoyaltyConfig
      )
      .accounts({
        store: storePDA,
        owner: storeOwner.publicKey,
      })
      .signers([storeOwner])
      .rpc();

    // Verify updated store data
    const storeAccount = await program.account.store.fetch(storePDA);
    assert.equal(storeAccount.name, newName);
    assert.equal(storeAccount.description, newDescription);
    assert.equal(storeAccount.logoUri, newLogoUri);
    assert.equal(storeAccount.loyaltyConfig.pointsPerDollar.toNumber(), 20);
  });

  it("should initialize loyalty program", async () => {
    const [loyaltyMintPDA] = findLoyaltyMintPDA(program.programId, storePDA);
    const loyaltyTokenMint = Keypair.generate();
    const pointsPerSol = new anchor.BN(1000); // 1000 points per SOL
    const redemptionRate = new anchor.BN(100); // 100 points = 1 SOL

    await program.methods
      .initializeLoyaltyMint(pointsPerSol, redemptionRate, false)
      .accounts({
        store: storePDA,
        loyaltyMintAccount: loyaltyMintPDA,
        tokenMint: loyaltyTokenMint.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([storeOwner, loyaltyTokenMint])
      .rpc();

    // Verify loyalty mint account
    const loyaltyMintAccount = await program.account.loyaltyMintInfo.fetch(
      loyaltyMintPDA
    );
    assert.equal(loyaltyMintAccount.store.toString(), storePDA.toString());
    assert.equal(
      loyaltyMintAccount.mint.toString(),
      loyaltyTokenMint.publicKey.toString()
    );
    assert.equal(loyaltyMintAccount.pointsPerSol.toNumber(), 1000);
    assert.equal(loyaltyMintAccount.redemptionRate.toNumber(), 100);
  });
});
