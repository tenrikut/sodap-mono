use super::store::Store;
use crate::error::CustomError;
use crate::state::Escrow;
use crate::types::{AnomalyFlag, TokenizedType, TransactionStatus};
use anchor_lang::prelude::*;

#[account]
pub struct Product {
    pub uuid: [u8; 16],
    pub price: u64,
    pub stock: u64,
    pub tokenized_type: TokenizedType,
    pub is_active: bool,
    pub metadata_uri: String,
    pub store: Pubkey,
    pub authority: Pubkey,
}

impl Product {
    pub const LEN: usize = 8 + 16 + 8 + 8 + 1 + (4 + 200) + 32 + 32;
}

#[account]
pub struct Purchase {
    pub product_uuids: Vec<[u8; 16]>,
    pub quantities: Vec<u64>,
    pub total_paid: u64,
    pub gas_fee: u64,
    pub status: TransactionStatus,
    pub anomaly: AnomalyFlag,
    pub store: Pubkey,
    pub buyer: Pubkey,
    pub ts: i64,
}

impl Purchase {
    pub const LEN: usize = 8 + (4 + 10 * 16) + (4 + 10 * 8) + 8 + 8 + 1 + 1 + 32 + 32 + 8;
}

#[derive(Accounts)]
#[instruction(product_uuid: [u8; 16])]
pub struct RegisterProduct<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    #[account(
        init,
        payer = authority,
        space = Product::LEN,
        seeds = [b"product", store.key().as_ref(), product_uuid.as_ref()],
        bump
    )]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(product_uuid: [u8; 16])]
pub struct UpdateProduct<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    #[account(
        mut,
        seeds = [b"product", store.key().as_ref(), product_uuid.as_ref()],
        bump,
        has_one = store,
        has_one = authority
    )]
    pub product: Account<'info, Product>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(product_uuid: [u8; 16])]
pub struct DeactivateProduct<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    #[account(
        mut,
        seeds = [b"product", store.key().as_ref(), product_uuid.as_ref()],
        bump,
        has_one = store,
        has_one = authority
    )]
    pub product: Account<'info, Product>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct PurchaseCart<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    #[account(
        init,
        payer = buyer,
        space = Purchase::LEN,
        seeds = [b"purchase", store.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub receipt: Account<'info, Purchase>,
    /// The buyer who is paying for the cart
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// The store owner who receives payment
    #[account(
        mut,
        constraint = store_owner.key() == store.owner @ CustomError::UnauthorizedStoreAccess
    )]
    /// CHECK: We verify this is the store owner in the constraint above
    pub store_owner: AccountInfo<'info>,
    /// The escrow account that holds funds during the purchase
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}
/// off‑chain log
#[event]
pub struct CartPurchased {
    pub store_id: Pubkey,
    pub buyer_id: Pubkey,
    pub product_uuids: Vec<[u8; 16]>,
    pub quantities: Vec<u64>,
    pub total_paid: u64,
    pub gas_fee: u64,
    pub timestamp: i64,
}
