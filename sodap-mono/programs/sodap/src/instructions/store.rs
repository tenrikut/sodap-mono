use crate::error::CustomError;
use crate::state::store::{AdminRole, Store};
use crate::types::AdminRoleType;
use anchor_lang::prelude::*;

/// Instruction to register a new store
pub fn register_store(
    ctx: Context<RegisterStore>,
    name: String,
    description: String,
    logo_uri: String,
) -> Result<()> {
    let store = &mut ctx.accounts.store;
    let owner = &ctx.accounts.owner;

    store.owner = owner.key();
    store.name = name;
    store.description = description;
    store.logo_uri = logo_uri;
    store.is_active = true;
    store.revenue = 0;
    store.admin_roles = vec![];
    store.bump = ctx.bumps.store;
    store.escrow_bump = ctx.bumps.escrow;

    Ok(())
}

/// Instruction to update a store's metadata
pub fn update_store(
    ctx: Context<UpdateStore>,
    _store_id: Pubkey, // optional, for logging
    name: Option<String>,
    description: Option<String>,
    logo_uri: Option<String>,
) -> Result<()> {
    let store = &mut ctx.accounts.store;
    let authority = &ctx.accounts.owner;

    // Only the owner can update
    require!(authority.key() == store.owner, CustomError::Unauthorized);
    require!(authority.is_signer, CustomError::Unauthorized);

    if let Some(name) = name {
        store.name = name;
    }
    if let Some(description) = description {
        store.description = description;
    }
    if let Some(logo_uri) = logo_uri {
        store.logo_uri = logo_uri;
    }

    Ok(())
}

/// Instruction to add an admin to a store
pub fn add_admin(
    ctx: Context<AddAdmin>,
    _store_id: Pubkey,
    admin_pubkey: Pubkey,
    role_type: AdminRoleType,
) -> Result<()> {
    let store = &mut ctx.accounts.store;
    let authority = &ctx.accounts.owner;

    // Only the owner can add admins
    require!(authority.key() == store.owner, CustomError::Unauthorized);
    require!(authority.is_signer, CustomError::Unauthorized);

    if store
        .admin_roles
        .iter()
        .any(|r| r.admin_pubkey == admin_pubkey)
    {
        return Err(CustomError::AdminAlreadyExists.into());
    }

    store.admin_roles.push(AdminRole {
        admin_pubkey,
        role_type,
    });
    Ok(())
}

/// Instruction to remove an admin from a store
pub fn remove_admin(
    ctx: Context<RemoveAdmin>,
    _store_id: Pubkey,
    admin_pubkey: Pubkey,
) -> Result<()> {
    let store = &mut ctx.accounts.store;
    let authority = &ctx.accounts.owner;

    // Only the owner can remove admins
    require!(authority.key() == store.owner, CustomError::Unauthorized);
    require!(authority.is_signer, CustomError::Unauthorized);

    store.admin_roles.retain(|r| r.admin_pubkey != admin_pubkey);
    Ok(())
}

pub fn release_escrow(ctx: Context<ReleaseEscrow>, amount: u64) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.owner.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;
    ctx.accounts.store.revenue = ctx.accounts.store.revenue.checked_add(amount).unwrap();
    Ok(())
}

// 3) refund_escrow: send from escrow PDA to buyer
pub fn refund_escrow(ctx: Context<RefundEscrow>, amount: u64) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.buyer.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;
    Ok(())
}
#[derive(Accounts)]
#[instruction()]
pub struct RegisterStore<'info> {
    #[account(
        init,
        seeds = [b"store", owner.key().as_ref()],
        bump,
        payer = payer,
        space = Store::LEN,
    )]
    pub store: Account<'info, Store>,

    #[account(
        init,
        seeds = [b"escrow", store.key().as_ref()],
        bump,
        payer = payer,
        space = 0,
    )]
    /// CHECK: Escrow account to hold payments
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut, has_one = owner)]
    pub store: Account<'info, Store>,

    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump = store.escrow_bump,
        seeds::program = system_program.key()
    )]
    /// CHECK: escrow vault PDA
    pub escrow: AccountInfo<'info>,

    #[account(mut, address = store.owner)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,

    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump = store.escrow_bump,
    )]
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Re-export contexts from state
pub use crate::state::store::{AddAdmin, RemoveAdmin, UpdateStore};
// pub use self::register_store;
