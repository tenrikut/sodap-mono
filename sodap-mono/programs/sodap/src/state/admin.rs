// Admin and platform admin-related instructions, events, and accounts will be placed here.

use crate::error;
use crate::utils::auth::{check_root_password, is_super_root_admin};
use anchor_lang::prelude::*;

// Platform admin accounts
#[account]
pub struct PlatformAdmins {
    pub admins: Vec<Pubkey>,
}

impl PlatformAdmins {
    pub const LEN: usize = 4 + 32 * 10; // Up to 10 platform admins
}

// Platform admin events
#[event]
pub struct PlatformAdminAdded {
    pub admin_pubkey: Pubkey,
    pub added_at: i64,
}

#[event]
pub struct PlatformAdminRemoved {
    pub admin_pubkey: Pubkey,
    pub removed_at: i64,
}

#[derive(Accounts)]
pub struct AddPlatformAdmin<'info> {
    #[account(mut, seeds = [b"platform_admins"], bump)]
    pub platform_admins: Account<'info, PlatformAdmins>,
    /// CHECK: This is safe because we only check that the signer is the super root admin
    #[account(signer)]
    pub signer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RemovePlatformAdmin<'info> {
    #[account(mut, seeds = [b"platform_admins"], bump)]
    pub platform_admins: Account<'info, PlatformAdmins>,
    /// CHECK: This is safe because we only check that the signer is the super root admin
    #[account(signer)]
    pub signer: AccountInfo<'info>,
}
