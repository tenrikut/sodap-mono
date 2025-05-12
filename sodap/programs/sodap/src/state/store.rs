use crate::types::AdminRoleType;
use crate::types::LoyaltyConfig;
use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct Store {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub logo_uri: String,
    pub loyalty_config: LoyaltyConfig,
    pub is_active: bool,
    pub revenue: u64,    // accumulated withdrawn funds
    pub bump: u8,        // bump for store PDA
    pub escrow_bump: u8, // bump for escrow PDA
    pub admin_roles: Vec<AdminRole>,
}

impl Store {
    pub const LEN: usize =
        8 + 32 + (4 + 200) + (4 + 500) + (4 + 200) + 16 + 1 + 8 + (4 + (33 * 10));
}
// Store events
#[event]
pub struct StoreRegistered {
    pub store_id: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub created_at: i64,
}

#[event]
pub struct StoreUpdated {
    pub store_id: Pubkey,
    pub updated_by: Pubkey,
    pub updated_at: i64,
}

#[event]
pub struct AdminAdded {
    pub store_id: Pubkey,
    pub admin_pubkey: Pubkey,
    pub role_type: AdminRoleType,
    pub added_at: i64,
}

#[event]
pub struct AdminRemoved {
    pub store_id: Pubkey,
    pub admin_pubkey: Pubkey,
    pub removed_at: i64,
}

// Store/admin accounts
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct AdminRole {
    pub admin_pubkey: Pubkey,
    pub role_type: AdminRoleType,
}

// Context structs for store/admin instructions
#[derive(Accounts)]
#[instruction(store_id: Pubkey)]
pub struct RegisterStore<'info> {
    #[account(
        init,
        payer = authority,
        space = Store::LEN,
        seeds = [b"store", authority.key().as_ref()],
        bump
    )]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(store_id: Pubkey)]
pub struct UpdateStore<'info> {
    #[account(
        mut,
        seeds = [b"store", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub store: Account<'info, Store>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(store_id: Pubkey)]
pub struct AddAdmin<'info> {
    #[account(
        mut,
        seeds = [b"store", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub store: Account<'info, Store>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(store_id: Pubkey)]
pub struct RemoveAdmin<'info> {
    #[account(
        mut,
        seeds = [b"store", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub store: Account<'info, Store>,
    pub owner: Signer<'info>,
}

pub fn has_role(store: &Store, user: &Pubkey, role: AdminRoleType) -> bool {
    store
        .admin_roles
        .iter()
        .any(|r| r.admin_pubkey == *user && r.role_type == role)
}
