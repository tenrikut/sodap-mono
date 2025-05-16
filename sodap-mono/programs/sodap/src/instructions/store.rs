use crate::error::CustomError;
use crate::state::store::{AdminRole, Store};
use crate::types::{AdminRoleType, LoyaltyConfig};
use crate::Escrow;
use anchor_lang::prelude::*;

pub fn register_store(
    ctx: Context<RegisterStore>,
    name: String,
    description: String,
    logo_uri: String,
    loyalty_config: LoyaltyConfig,
) -> Result<()> {
    let store = &mut ctx.accounts.store;

    // Initialize store
    store.owner = ctx.accounts.authority.key();
    store.name = name;
    store.description = description;
    store.logo_uri = logo_uri;
    store.loyalty_config = loyalty_config;
    store.is_active = true;
    store.revenue = 0;
    store.bump = ctx.bumps.store;
    store.admin_count = 1;

    // Add owner as first admin
    store.admin_roles[0] = AdminRole {
        admin_pubkey: ctx.accounts.authority.key(),
        role_type: AdminRoleType::Owner,
    };

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    name: String,
    description: String,
    logo_uri: String,
    loyalty_config: LoyaltyConfig,
)]
pub struct RegisterStore<'info> {
    #[account(
        init,
        payer = authority,
        space = Store::DISCRIMINATOR.len() + Store::LEN,
        seeds = [b"store", authority.key().as_ref()],
        bump
    )]
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StoreEscrow<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = Escrow::DISCRIMINATOR.len() + Escrow::LEN,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, Escrow>,
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    name: Option<String>,
    description: Option<String>,
    logo_uri: Option<String>,
    loyalty_config: Option<LoyaltyConfig>,
)]
pub struct UpdateStore<'info> {
    #[account(
        mut,
        seeds = [b"store", owner.key().as_ref()],
        bump = store.bump,
        has_one = owner,
    )]
    pub store: Account<'info, Store>,
    pub owner: Signer<'info>,
}

pub fn update_store(
    ctx: Context<UpdateStore>,
    name: Option<String>,
    description: Option<String>,
    logo_uri: Option<String>,
    loyalty_config: Option<LoyaltyConfig>,
) -> Result<()> {
    let store = &mut ctx.accounts.store;

    if let Some(name) = name {
        store.name = name;
    }

    if let Some(description) = description {
        store.description = description;
    }

    if let Some(logo_uri) = logo_uri {
        store.logo_uri = logo_uri;
    }

    if let Some(loyalty_config) = loyalty_config {
        store.loyalty_config = loyalty_config;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct AddAdmin<'info> {
    #[account(
        mut,
        seeds = [b"store", owner.key().as_ref()],
        bump = store.bump,
        has_one = owner,
    )]
    pub store: Account<'info, Store>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveAdmin<'info> {
    #[account(
        mut,
        seeds = [b"store", owner.key().as_ref()],
        bump = store.bump,
        has_one = owner,
    )]
    pub store: Account<'info, Store>,
    pub owner: Signer<'info>,
}

pub fn add_admin(
    ctx: Context<AddAdmin>,
    admin_pubkey: Pubkey,
    role_type: AdminRoleType,
) -> Result<()> {
    let store = &mut ctx.accounts.store;

    store.add_admin(AdminRole {
        admin_pubkey,
        role_type,
    })?;

    Ok(())
}

pub fn remove_admin(ctx: Context<RemoveAdmin>, admin_pubkey: Pubkey) -> Result<()> {
    let store = &mut ctx.accounts.store;
    store.remove_admin(admin_pubkey)?;
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
pub struct ReleaseEscrow<'info> {
    #[account(mut, has_one = owner)]
    pub store: Account<'info, Store>,

    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump = store.escrow_bump,
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
