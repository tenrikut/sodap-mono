use crate::error::CustomError;
use anchor_lang::prelude::*;

// Submodules for on-chain accounts and context structs
pub mod admin;
pub mod loyalty;
pub mod product;
pub mod store;
pub mod user;

// Re-export all relevant structs and context types
pub use admin::*;
pub use loyalty::*;
pub use product::PurchaseCart;
pub use product::*;
pub use store::Store;
pub use store::*;
pub use user::*;

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, Escrow>,
    pub store: Account<'info, Store>,
    #[account(
        mut,
        constraint = store_owner.key() == store.owner @ CustomError::Unauthorized
    )]
    pub store_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, Escrow>,
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        constraint = store_owner.key() == store.owner @ CustomError::Unauthorized
    )]
    pub store_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct LoyaltyMint {
    pub store: Pubkey,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub points_per_sol: u64,
    pub redemption_rate: u64,
    pub total_points_issued: u64,
    pub total_points_redeemed: u64,
    pub is_token2022: bool,
}

#[account]
pub struct Escrow {
    pub store: Pubkey,
    pub authority: Pubkey,
    pub balance: u64,
}
