use crate::error::CustomError;
use crate::state::admin::{
    AddPlatformAdmin, PlatformAdminAdded, PlatformAdminRemoved, RemovePlatformAdmin,
};
use crate::utils::auth::{check_root_password, is_super_root_admin};
use anchor_lang::prelude::*;

pub fn add_platform_admin(
    ctx: Context<AddPlatformAdmin>,
    new_admin: Pubkey,
    username: String,
    password: String,
) -> Result<()> {
    let signer = ctx.accounts.signer.key();
    let super_admin_pubkey = Pubkey::new_from_array([0u8; 32]); // Replace with actual super admin pubkey

    require!(
        is_super_root_admin(&signer, &super_admin_pubkey),
        CustomError::Unauthorized
    );
    require!(
        check_root_password(&username, &password, "admin", "password"),
        CustomError::Unauthorized
    );
    require!(signer != new_admin, CustomError::Unauthorized);

    let platform_admins = &mut ctx.accounts.platform_admins;

    // Check for space
    require!(
        platform_admins.admin_count < 10,
        CustomError::MaxAdminsReached
    );

    // Check for duplicates
    let count = platform_admins.admin_count as usize;
    for i in 0..count {
        if platform_admins.admins[i] == new_admin {
            return err!(CustomError::AdminAlreadyExists);
        }
    }

    // Add the new admin
    let idx = platform_admins.admin_count as usize;
    platform_admins.admins[idx] = new_admin;
    platform_admins.admin_count += 1;

    emit!(PlatformAdminAdded {
        admin_pubkey: new_admin,
        added_at: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn remove_platform_admin(
    ctx: Context<RemovePlatformAdmin>,
    admin_pubkey: Pubkey,
    username: String,
    password: String,
) -> Result<()> {
    let signer = ctx.accounts.signer.key();
    let super_admin_pubkey = Pubkey::new_from_array([0u8; 32]); // Replace with actual super admin pubkey

    require!(
        is_super_root_admin(&signer, &super_admin_pubkey),
        CustomError::Unauthorized
    );
    require!(
        check_root_password(&username, &password, "admin", "password"),
        CustomError::Unauthorized
    );
    require!(signer != admin_pubkey, CustomError::Unauthorized);

    let platform_admins = &mut ctx.accounts.platform_admins;

    // Find the admin
    let mut found_idx = None;
    let count = platform_admins.admin_count as usize;
    for i in 0..count {
        if platform_admins.admins[i] == admin_pubkey {
            found_idx = Some(i);
            break;
        }
    }

    if let Some(idx) = found_idx {
        let count = platform_admins.admin_count as usize;
        // Shift remaining admins forward
        for i in idx..(count - 1) {
            platform_admins.admins[i] = platform_admins.admins[i + 1];
        }
        platform_admins.admin_count = platform_admins.admin_count.saturating_sub(1);

        emit!(PlatformAdminRemoved {
            admin_pubkey,
            removed_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    } else {
        err!(CustomError::AdminNotFound)
    }
}
