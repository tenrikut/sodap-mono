import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  createAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { Sodap } from "../../target/types/sodap";
import {
  findStorePDA,
  findLoyaltyMintPDA,
  findEscrowPDA,
} from "../../utils/pda-helpers";

describe("SODAP Loyalty Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sodap as Program<Sodap>;
  let storeOwner: Keypair;
  let storePDA: PublicKey;
  let escrowPDA: PublicKey;
  let loyaltyMintPDA: PublicKey;
  let loyaltyMint: Keypair;
  let buyer: Keypair;
  let buyerTokenAccount: PublicKey;

  before(async () => {
    storeOwner = Keypair.generate();
    buyer = Keypair.generate();
    loyaltyMint = Keypair.generate();

    // Airdrop SOL to store owner and buyer
    let signature = await provider.connection.requestAirdrop(
      storeOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    signature = await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Setup store
    [storePDA] = findStorePDA(program.programId, storeOwner.publicKey);
    [escrowPDA] = findEscrowPDA(program.programId, storePDA);
    [loyaltyMintPDA] = findLoyaltyMintPDA(program.programId, storePDA);

    // Register store
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
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Create loyalty token mint
    await program.methods
      .initializeLoyaltyMint(
        new anchor.BN(1000), // 1000 points per SOL
        new anchor.BN(100), // 100 points = 1 SOL
        false
      )
      .accounts({
        store: storePDA,
        loyaltyMintAccount: loyaltyMintPDA,
        tokenMint: loyaltyMint.publicKey,
        payer: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([storeOwner, loyaltyMint])
      .rpc();

    // Create buyer's token account
    buyerTokenAccount = await getAssociatedTokenAddress(
      loyaltyMint.publicKey,
      buyer.publicKey
    );
  });

  it("should initialize loyalty program correctly", async () => {
    const loyaltyMintInfo = await program.account.loyaltyMintInfo.fetch(
      loyaltyMintPDA
    );
    assert.equal(loyaltyMintInfo.store.toString(), storePDA.toString());
    assert.equal(
      loyaltyMintInfo.mint.toString(),
      loyaltyMint.publicKey.toString()
    );
    assert.equal(loyaltyMintInfo.pointsPerSol.toNumber(), 1000);
    assert.equal(loyaltyMintInfo.redemptionRate.toNumber(), 100);
  });

  it("should mint loyalty points after purchase", async () => {
    const purchaseAmount = new anchor.BN(1_000_000); // 1 SOL

    // Setup escrow first
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

    // Mint loyalty points
    await program.methods
      .mintLoyaltyPoints(purchaseAmount)
      .accounts({
        store: storePDA,
        loyaltyMintInfo: loyaltyMintPDA,
        tokenMint: loyaltyMint.publicKey,
        tokenAccount: buyerTokenAccount,
        mintAuthority: loyaltyMintPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    // Check buyer's token balance
    const expectedPoints = 1000; // 1000 points per SOL
    const tokenBalance = await provider.connection.getTokenAccountBalance(
      buyerTokenAccount
    );
    assert.equal(tokenBalance.value.uiAmount, expectedPoints);
  });

  it("should redeem loyalty points for SOL", async () => {
    const pointsToRedeem = new anchor.BN(100); // 100 points = 1 SOL
    const buyerInitialBalance = await provider.connection.getBalance(
      buyer.publicKey
    );

    await program.methods
      .redeemLoyaltyPoints(pointsToRedeem, true)
      .accounts({
        store: storePDA,
        user: buyer.publicKey,
        tokenAccount: buyerTokenAccount,
        escrowAccount: escrowPDA,
        loyaltyMintInfo: loyaltyMintPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    // Verify points were burned
    const tokenBalance = await provider.connection.getTokenAccountBalance(
      buyerTokenAccount
    );
    assert.equal(tokenBalance.value.uiAmount, 900); // 1000 - 100

    // Verify SOL was received
    const buyerFinalBalance = await provider.connection.getBalance(
      buyer.publicKey
    );
    assert.approximately(
      buyerFinalBalance - buyerInitialBalance,
      1_000_000, // 1 SOL
      100000 // Allow for gas fees
    );
  });

  it("should fail to redeem more points than available", async () => {
    const pointsToRedeem = new anchor.BN(1000); // Try to redeem more points than available
    try {
      await program.methods
        .redeemLoyaltyPoints(pointsToRedeem, true)
        .accounts({
          store: storePDA,
          user: buyer.publicKey,
          tokenAccount: buyerTokenAccount,
          escrowAccount: escrowPDA,
          loyaltyMintInfo: loyaltyMintPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err) {
      assert.include(err.toString(), "insufficient");
    }
  });

  it("should fail redemption when escrow has insufficient balance", async () => {
    // First drain the escrow
    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    await program.methods
      .releaseEscrow(new anchor.BN(escrowBalance))
      .accounts({
        store: storePDA,
        escrowAccount: escrowPDA,
        storeOwner: storeOwner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([storeOwner])
      .rpc();

    // Try to redeem points
    try {
      await program.methods
        .redeemLoyaltyPoints(new anchor.BN(100), true)
        .accounts({
          store: storePDA,
          user: buyer.publicKey,
          tokenAccount: buyerTokenAccount,
          escrowAccount: escrowPDA,
          loyaltyMintInfo: loyaltyMintPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      assert.fail("Expected error but got success");
    } catch (err) {
      assert.include(err.toString(), "InsufficientEscrowBalance");
    }
  });
});
