use crate::error::CustomError;
use crate::state::store::Store;
use crate::state::loyalty::LoyaltyMint;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};
use anchor_spl::token_2022::Token2022;

#[derive(Accounts)]
pub struct LoyaltyTransferHook<'info> {
    #[account(mut)]
    pub mint: Account<'info, token::Mint>,
    #[account(mut)]
    pub from: Account<'info, token::TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, token::TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(points_per_sol: u64, redemption_rate: u64, use_token2022: bool)]
pub struct InitializeLoyaltyMint<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    
    #[account(
        init,
        payer = payer,
        space = LoyaltyMint::DISCRIMINATOR.len() + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump
    )]
    pub loyalty_mint: Account<'info, LoyaltyMint>,
    
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = mint_authority,
    )]
    /// The actual token mint account that will be controlled by the program
    pub token_mint: Account<'info, token::Mint>,
    
    /// Account that will have authority to mint tokens
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(purchase_amount_lamports: u64)]
pub struct MintLoyaltyTokens<'info> {
    #[account(mut)]
    pub loyalty_mint: Account<'info, LoyaltyMint>,
    
    #[account(
        mut,
        constraint = token_mint.key() == loyalty_mint.mint @ CustomError::InvalidMint
    )]
    pub token_mint: Account<'info, token::Mint>,
    
    #[account(mut)]
    pub token_account: Account<'info, token::TokenAccount>,
    
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(points_to_redeem: u64, redeem_for_sol: bool)]
pub struct RedeemLoyaltyPoints<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    
    #[account(mut)]
    pub loyalty_mint: Account<'info, LoyaltyMint>,
    
    #[account(
        mut,
        constraint = token_mint.key() == loyalty_mint.mint @ CustomError::InvalidMint
    )]
    pub token_mint: Account<'info, token::Mint>,
    
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = user,
    )]
    pub token_account: Account<'info, token::TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump = store.escrow_bump
    )]
    pub escrow_account: Option<Account<'info, crate::Escrow>>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_loyalty_mint(ctx: Context<InitializeLoyaltyMint>) -> Result<()> {
    let loyalty_mint = &mut ctx.accounts.loyalty_mint;
    loyalty_mint.store = ctx.accounts.store.key();
    loyalty_mint.authority = ctx.accounts.mint_authority.key();

    // Initialize Token mint
    token::initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::InitializeMint {
                mint: ctx.accounts.token_mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        6, // 6 decimals
        &ctx.accounts.mint_authority.key(),
        None,
    )?;

    Ok(())
}

pub fn mint_loyalty_points(
    ctx: Context<MintLoyaltyTokens>,
    amount: u64,
) -> Result<()> {
    // Perform the token mint operation
    let mint_info = ctx.accounts.token_mint.to_account_info();
    let destination_info = ctx.accounts.token_account.to_account_info();
    let authority_info = ctx.accounts.mint_authority.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();

    let cpi_accounts = token::MintTo {
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
    // Perform the token burn operation
    let mint_info = ctx.accounts.token_mint.to_account_info();
    let source_info = ctx.accounts.token_account.to_account_info();
    let authority_info = ctx.accounts.user.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();

    let cpi_accounts = token::Burn {
        mint: mint_info,
        from: source_info,
        authority: authority_info,
    };

    let cpi_ctx = CpiContext::new(token_program_info, cpi_accounts);
    token::burn(cpi_ctx, points_to_redeem)?;

    Ok(())
}

pub fn handle_transfer_hook(ctx: Context<LoyaltyTransferHook>, amount: u64) -> Result<()> {
    // Perform the token mint operation
    let mint_info = ctx.accounts.mint.to_account_info();
    let to_info = ctx.accounts.to.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();

    let cpi_accounts = token::MintTo {
        mint: mint_info,
        to: to_info,
        authority: authority_info,
    };

    let cpi_ctx = CpiContext::new(token_program_info, cpi_accounts);
    token::mint_to(cpi_ctx, amount)?;

    Ok(())
}
