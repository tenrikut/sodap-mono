use super::store::Store;
use crate::error::CustomError;
use crate::state::Escrow;
use crate::types::TokenizedType;
use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};

#[account]
#[derive(Debug, Copy, Pod, Zeroable)]
#[repr(C, align(8))]
pub struct Product {
    pub uuid: [u8; 16],                // 16 bytes
    pub price: u64,                    // 8 bytes
    pub stock: u64,                    // 8 bytes
    pub tokenized_type: TokenizedType, // 1 byte
    pub is_active: u8,                 // 1 byte (0 = false, 1 = true)
    pub _padding: [u8; 6],             // 6 bytes padding for 8-byte alignment
    pub metadata_uri: [u8; 128],       // 128 bytes
    pub store: Pubkey,                 // 32 bytes
    pub authority: Pubkey,             // 32 bytes
}

impl Default for Product {
    fn default() -> Self {
        Product {
            uuid: [0; 16],
            price: 0,
            stock: 0,
            tokenized_type: TokenizedType::NonTokenized,
            is_active: 0,
            _padding: [0; 6],
            metadata_uri: [0; 128],
            store: Pubkey::default(),
            authority: Pubkey::default(),
        }
    }
}

impl Product {
    pub const LEN: usize = 8 +    // discriminator
        16 +    // uuid
        8 +     // price
        8 +     // stock
        1 +     // tokenized_type
        1 +     // is_active
        6 +     // padding
        200 +   // metadata_uri
        32 +    // store
        32; // authority

    pub fn set_metadata_uri(&mut self, uri: &str) -> Result<()> {
        require!(uri.len() <= 128, CustomError::StringTooLong);
        self.metadata_uri = [0; 128];
        self.metadata_uri[..uri.len()].copy_from_slice(uri.as_bytes());
        Ok(())
    }

    pub fn get_metadata_uri(&self) -> String {
        let nullpos = self
            .metadata_uri
            .iter()
            .position(|&x| x == 0)
            .unwrap_or(self.metadata_uri.len());
        String::from_utf8_lossy(&self.metadata_uri[..nullpos]).to_string()
    }
}

#[account]
#[derive(Debug, Copy, Pod, Zeroable)]
#[repr(C, align(8))]
pub struct Purchase {
    pub product_ids: [Pubkey; 10], // 320 bytes
    pub quantities: [u64; 10],     // 80 bytes
    pub product_count: u8,         // 1 byte
    pub _padding: [u8; 7],         // 7 bytes padding
    pub total_paid: u64,           // 8 bytes
    pub gas_fee: u64,              // 8 bytes
    pub store: Pubkey,             // 32 bytes
    pub buyer: Pubkey,             // 32 bytes
    pub timestamp: i64,            // 8 bytes
    pub status: u8,                // 1 byte
    pub _padding2: [u8; 7],        // 7 bytes padding
}

impl Default for Purchase {
    fn default() -> Self {
        Purchase {
            product_ids: [Pubkey::default(); 10],
            quantities: [0; 10],
            product_count: 0,
            _padding: [0; 7],
            total_paid: 0,
            gas_fee: 0,
            store: Pubkey::default(),
            buyer: Pubkey::default(),
            timestamp: 0,
            status: 0,
            _padding2: [0; 7],
        }
    }
}

impl Purchase {
    pub const LEN: usize = 8 +    // discriminator
        (32 * 10) +  // product_ids
        (8 * 10) +   // quantities
        1 +          // product_count
        7 +          // padding
        8 +          // total_paid
        8 +          // gas_fee
        32 +         // store
        32 +         // buyer
        8 +          // timestamp
        1 +          // status
        7; // padding2
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

/// Off-chain log of purchase events
#[event]
pub struct CartPurchased {
    pub store_id: Pubkey,
    pub buyer_id: Pubkey,
    pub product_uuids: Vec<[u8; 16]>,
    pub quantities: Vec<u64>,
    pub total_paid: u64,
    pub gas_fee: u64,
    pub timestamp: i64,
    pub product_count: u8,
}
