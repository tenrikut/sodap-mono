// Admin and platform admin-related instructions, events, and accounts will be placed here.

use crate::error::CustomError;
use crate::utils::auth::{check_root_password, is_super_root_admin};
use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};

#[account]
#[derive(Debug, Default, Pod, Zeroable, Copy)]
#[repr(C)]
pub struct PlatformAdmins {
    pub admins: [Pubkey; 10],
    pub admin_count: u8,
}

impl PlatformAdmins {
    pub const LEN: usize = PlatformAdmins::DISCRIMINATOR.len() + 
        (32 * 10) + // admins (fixed size array)
        1;          // admin_count

    pub fn add_admin(&mut self, admin_pubkey: Pubkey) -> Result<()> {
        require!(
            self.admin_count < 10,
            CustomError::MaxAdminsReached
        );
        
        let count = self.admin_count as usize;
        // Check for duplicates
        for i in 0..count {
            if self.admins[i] == admin_pubkey {
                return err!(CustomError::AdminAlreadyExists);
            }
        }
        
        // Add the admin
        self.admins[count] = admin_pubkey;
        self.admin_count += 1;
        
        Ok(())
    }

    pub fn remove_admin(&mut self, admin_pubkey: Pubkey) -> Result<()> {
        let mut found_idx = None;
        let count = self.admin_count as usize;
        
        for i in 0..count {
            if self.admins[i] == admin_pubkey {
                found_idx = Some(i);
                break;
            }
        }
        
        if let Some(idx) = found_idx {
            // Shift remaining admins forward
            for i in idx..(count - 1) {
                self.admins[i] = self.admins[i + 1];
            }
            self.admin_count = self.admin_count.saturating_sub(1);
            Ok(())
        } else {
            err!(CustomError::AdminNotFound)
        }
    }
}

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
#[instruction(admin_tag: [u8; 15])]
pub struct AddPlatformAdmin<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = PlatformAdmins::LEN,
        seeds = [b"platform_admins", &admin_tag],
        bump
    )]
    pub platform_admins: Account<'info, PlatformAdmins>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(admin_tag: [u8; 15])]
pub struct RemovePlatformAdmin<'info> {
    #[account(
        mut,
        seeds = [b"platform_admins", &admin_tag],
        bump
    )]
    pub platform_admins: Account<'info, PlatformAdmins>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn add_platform_admin(ctx: Context<AddPlatformAdmin>, admin_pubkey: Pubkey) -> Result<()> {
    let platform_admins = &mut ctx.accounts.platform_admins;
    platform_admins.add_admin(admin_pubkey)
}

pub fn remove_platform_admin(ctx: Context<RemovePlatformAdmin>, admin_pubkey: Pubkey) -> Result<()> {
    let platform_admins = &mut ctx.accounts.platform_admins;
    platform_admins.remove_admin(admin_pubkey)
}
