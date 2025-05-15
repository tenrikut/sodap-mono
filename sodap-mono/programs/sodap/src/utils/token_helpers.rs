use crate::state::loyalty::LoyaltyMint;
use crate::state::store::Store;
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount},
};

// A simplified structure for Token2022 operations with smaller stack frames
#[derive(Accounts)]
pub struct Token2022BaseAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,
    
    // System program
    pub system_program: Program<'info, System>,
}

// Loyalty mint account that is compact
#[derive(Accounts)]
pub struct LoyaltyMintAccounts<'info> {
    // Loyalty mint info
    #[account(
        mut,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump,
    )]
    pub loyalty_mint_account: Account<'info, LoyaltyMint>,
    
    // Reference to store
    pub store: Account<'info, Store>,
}

// Token program accounts separated
#[derive(Accounts)]
pub struct TokenProgramAccounts<'info> {
    // SPL token mint
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    // Token account
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    // Token program
    pub token_program: Program<'info, Token>,
}

// Helper functions to process token operations with reduced stack and proper lifetimes
pub fn mint_token_helper<'a>(
    token_program: &Program<'a, Token>,
    token_mint: &Account<'a, Mint>,
    token_account: &Account<'a, TokenAccount>,
    mint_authority: &Signer<'a>,
    amount: u64,
) -> Result<()> {
    let cpi_accounts = token::MintTo {
        mint: token_mint.to_account_info(),
        to: token_account.to_account_info(),
        authority: mint_authority.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
    token::mint_to(cpi_ctx, amount)?;
    
    Ok(())
}

// Helper for burning tokens
pub fn burn_token_helper<'a>(
    token_program: &Program<'a, Token>,
    token_mint: &Account<'a, Mint>,
    token_account: &Account<'a, TokenAccount>,
    authority: &Signer<'a>,
    amount: u64,
) -> Result<()> {
    let cpi_accounts = token::Burn {
        mint: token_mint.to_account_info(),
        from: token_account.to_account_info(),
        authority: authority.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
    token::burn(cpi_ctx, amount)?;
    
    Ok(())
}
