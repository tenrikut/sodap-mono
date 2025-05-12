import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sodap } from "../target/types/sodap";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("User Wallet and Store Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Sodap as Program<Sodap>;

  const user = Keypair.generate();
  let userProfilePDA: PublicKey;
  let storePDA: PublicKey;
  let escrowPDA: PublicKey;

  it("Initializes the program", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Program initialized:", tx);
  });

  it("Airdrops SOL to user", async () => {
    const airdropSig = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    console.log("Airdropped 2 SOL to user");
  });

  it("Creates a user wallet", async () => {
    [userProfilePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_wallet"), user.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createUserWallet()
      .accounts({
        userProfile: userProfilePDA,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("User wallet created:", tx);
    console.log("User Profile PDA:", userProfilePDA.toString());

    // Verify the user profile was created
    const userProfile = await program.account.userProfile.fetch(userProfilePDA);
    assert.equal(userProfile.authority.toString(), user.publicKey.toString());
  });

  it("Creates a store and verifies PDA", async () => {
    // Generate Store PDA
    [storePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("store"), user.publicKey.toBuffer()],
      program.programId
    );

    // Generate Escrow PDA
    [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), storePDA.toBuffer()],
      program.programId
    );

    console.log("Store PDA:", storePDA.toString());
    console.log("Escrow PDA:", escrowPDA.toString());

    // Register store
    const tx = await program.methods
      .registerStore(
        "Test Store",
        "A test store for verification",
        "https://example.com/logo.png",
        {
          pointsPerDollar: new BN(10),
          minimumPurchase: new BN(100),
          rewardPercentage: new BN(5),
          isActive: true,
        }
      )
      .accounts({
        store: storePDA,
        escrow: escrowPDA,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Store registered:", tx);

    // Verify store was created
    const storeAccount = await program.account.store.fetch(storePDA);
    assert.equal(storeAccount.owner.toString(), user.publicKey.toString());
    assert.equal(storeAccount.name, "Test Store");
  });
});
