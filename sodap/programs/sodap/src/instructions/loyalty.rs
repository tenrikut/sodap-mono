use crate::error::CustomError;
use crate::state::loyalty::LoyaltyMint;
use crate::state::loyalty::{
    InitializeLoyaltyMint as InitializeLoyaltyMintState,
    MintLoyaltyTokens as MintLoyaltyTokensState, RedeemLoyaltyPoints as RedeemLoyaltyPointsState,
};
use crate::state::store::Store;
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, MintTo},
    token_2022,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct LoyaltyTransferHook<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub from: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub to: InterfaceAccount<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct InitializeLoyaltyMint<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump
    )]
    pub loyalty_mint: Account<'info, LoyaltyMint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintLoyaltyTokens<'info> {
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub loyalty_mint: Account<'info, LoyaltyMint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    #[account(mut)]
    pub destination: InterfaceAccount<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct RedeemLoyaltyPoints<'info> {
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub loyalty_mint: Account<'info, LoyaltyMint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    #[account(mut)]
    pub source: InterfaceAccount<'info, TokenAccount>,
}

pub fn initialize_loyalty_mint(ctx: Context<InitializeLoyaltyMint>) -> Result<()> {
    let loyalty_mint = &mut ctx.accounts.loyalty_mint;
    loyalty_mint.store = ctx.accounts.store.key();
    loyalty_mint.authority = ctx.accounts.authority.key();

    // Initialize Token2022 mint with TransferHook
    token_2022::initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_2022::InitializeMint {
                mint: ctx.accounts.loyalty_mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        9, // 9 decimals like SOL
        &ctx.accounts.authority.key(),
        Some(&ctx.accounts.authority.key()),
    )?;

    Ok(())
}

pub fn mint_loyalty_points(
    ctx: Context<MintLoyaltyTokens>,
    amount: u64,
    _destination: Pubkey,
) -> Result<()> {
    // First, perform the token mint operation
    let mint_info = ctx.accounts.loyalty_mint.to_account_info();
    let destination_info = ctx.accounts.destination.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();

    let cpi_accounts = MintTo {
        mint: mint_info,
        to: destination_info,
        authority: authority_info,
    };

    let cpi_ctx = CpiContext::new(token_program_info, cpi_accounts);
    token::mint_to(cpi_ctx, amount)?;

    Ok(())
}

pub fn redeem_loyalty_points(
    ctx: Context<RedeemLoyaltyPoints>,
    points_to_redeem: u64,
) -> Result<()> {
    // First, perform the token burn operation
    let mint_info = ctx.accounts.loyalty_mint.to_account_info();
    let source_info = ctx.accounts.source.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();

    let cpi_accounts = token_2022::Burn {
        mint: mint_info,
        from: source_info,
        authority: authority_info,
    };

    let cpi_ctx = CpiContext::new(token_program_info, cpi_accounts);
    token_2022::burn(cpi_ctx, points_to_redeem)?;

    Ok(())
}

pub fn handle_transfer_hook(ctx: Context<LoyaltyTransferHook>, amount: u64) -> Result<()> {
    // First, perform the token mint operation
    let mint_info = ctx.accounts.mint.to_account_info();
    let to_info = ctx.accounts.to.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();

    let cpi_accounts = MintTo {
        mint: mint_info,
        to: to_info,
        authority: authority_info,
    };

    let cpi_ctx = CpiContext::new(token_program_info, cpi_accounts);
    token::mint_to(cpi_ctx, amount)?;

    Ok(())
}
