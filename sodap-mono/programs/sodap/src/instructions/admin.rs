use crate::error::CustomError;
//use crate::state::admin::PlatformAdmins;
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
    if platform_admins.admins.contains(&new_admin) {
        return Err(CustomError::AdminAlreadyExists.into());
    }
    platform_admins.admins.push(new_admin);
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
    if !platform_admins.admins.contains(&admin_pubkey) {
        return Err(CustomError::AdminNotFound.into());
    }
    platform_admins.admins.retain(|a| a != &admin_pubkey);
    emit!(PlatformAdminRemoved {
        admin_pubkey,
        removed_at: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
