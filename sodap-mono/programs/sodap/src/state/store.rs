use crate::types::AdminRoleType;
use crate::error::CustomError;
use anchor_lang::prelude::*;

#[derive(Debug)]
#[account]
pub struct Store {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub logo_uri: String,
    pub is_active: bool,
    pub revenue: u64,    // accumulated withdrawn funds
    pub bump: u8,        // bump for store PDA
    pub escrow_bump: u8, // bump for escrow PDA
    pub admin_roles: Vec<AdminRole>,
}

impl Store {
    pub const MAX_ADMIN_ROLES: usize = 10;

    // Space calculation:
    // - 8 bytes for discriminator
    // - 32 bytes for owner Pubkey
    // - 4 + 200 bytes for name String
    // - 4 + 500 bytes for description String
    // - 4 + 200 bytes for logo_uri String
    // - 1 byte for is_active bool
    // - 8 bytes for revenue u64
    // - 1 byte for bump
    // - 1 byte for escrow_bump
    // - 4 bytes for Vec length prefix
    // - (32 + 1) * MAX_ADMIN_ROLES for admin_roles Vec (Pubkey + role_type)
    // - 1 byte for is_active bool
    // - 8 bytes for revenue u64
    // - 1 byte for bump
    // - 1 byte for escrow_bump
    // - 4 bytes for Vec length prefix
    // - (32 + 1) * MAX_ADMIN_ROLES for admin_roles Vec (Pubkey + role_type)
    pub const LEN: usize = 8 +  // discriminator
        32 +                    // owner
        (4 + 200) +            // name
        (4 + 500) +            // description
        (4 + 200) +            // logo_uri
        1 +                     // is_active
        8 +                     // revenue
        1 +                     // bump
        1 +                     // escrow_bump
        4 +                     // Vec length prefix
        (33 * Self::MAX_ADMIN_ROLES); // admin_roles (Pubkey + role_type)

    pub fn validate_admin_roles(&self) -> anchor_lang::Result<()> {
        anchor_lang::require!(self.admin_roles.len() <= Self::MAX_ADMIN_ROLES, CustomError::TooManyAdmins);
        Ok(())
    }
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
#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
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
        payer = payer,
        space = Store::LEN,
        seeds = [b"store", owner.key().as_ref()],
        bump
    )]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub owner: Signer<'info>,
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
    pub system_program: Program<'info, System>,
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
