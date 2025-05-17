use crate::error::CustomError;
use crate::state::store::{AdminRole, Store};
use crate::types::{AdminRoleType, LoyaltyConfig};
use crate::Escrow;
use anchor_lang::{prelude::*, Discriminator};

pub fn register_store(
    ctx: Context<RegisterStore>,
    name: String,
    description: String,
    logo_uri: String,
    loyalty_config: LoyaltyConfig,
) -> Result<()> {
    let store = &mut ctx.accounts.store;
    let escrow = &mut ctx.accounts.escrow;

    // Initialize store
    store.owner = ctx.accounts.owner.key();
    store.name = Box::new(name);
    store.description = Box::new(description);
    store.logo_uri = Box::new(logo_uri);
    store.loyalty_config = loyalty_config;
    store.is_active = true;
    store.revenue = 0;
    store.bump = ctx.bumps.store;
    store.escrow_bump = ctx.bumps.escrow;
    store.admin_count = 1;

    // Add owner as first admin
    let admin_role = AdminRole::new(ctx.accounts.owner.key(), AdminRoleType::Owner {});
    store.admin_roles[0] = admin_role;

    // Initialize escrow
    escrow.store = store.key();
    escrow.balance = 0;

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
        payer = payer,
        space = Store::DISCRIMINATOR.len() + Store::LEN,
        seeds = [b"store", owner.key().as_ref()],
        bump
    )]
    pub store: Account<'info, Store>,

    #[account(
        init,
        payer = payer,
        space = Escrow::DISCRIMINATOR.len() + Escrow::LEN,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
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
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
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
        store.name = Box::new(name);
    }

    if let Some(description) = description {
        store.description = Box::new(description);
    }

    if let Some(logo_uri) = logo_uri {
        store.logo_uri = Box::new(logo_uri);
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
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
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
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn add_admin(
    ctx: Context<AddAdmin>,
    admin_pubkey: Pubkey,
    role_type: AdminRoleType,
) -> Result<()> {
    let store = &mut ctx.accounts.store;

    // Check if admin already exists
    if store
        .admin_roles
        .iter()
        .any(|role| role.admin_pubkey == admin_pubkey)
    {
        return err!(CustomError::AdminAlreadyExists);
    }

    // Check if max admins reached
    if store.admin_count >= Store::MAX_ADMINS as u8 {
        return err!(CustomError::MaxAdminsReached);
    }

    // Validate role type
    match role_type {
        AdminRoleType::Owner => return err!(CustomError::Unauthorized),
        _ => {}
    }

    // Add new admin
    let admin_count = store.admin_count as usize;
    let admin_role = AdminRole::new(admin_pubkey, role_type);
    store.admin_roles[admin_count] = admin_role;
    store.admin_count += 1;

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
    /// CHECK: escrow vault PDA seeds checked in constraint and bump seed matched in store.escrow_bump
    /// Account data validation not needed as this is just a SOL vault
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
    /// CHECK: escrow vault PDA seeds checked in constraint and bump seed matched in store.escrow_bump
    /// Account data validation not needed as this is just a SOL vault
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
