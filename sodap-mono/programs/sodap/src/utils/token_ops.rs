use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// Helper function to mint tokens with reduced stack usage and proper lifetimes
pub fn mint_tokens<'a>(
    token_program: &Program<'a, Token>,
    mint: &Account<'a, Mint>,
    to: &Account<'a, TokenAccount>,
    authority: &Signer<'a>,
    amount: u64
) -> Result<()> {
    let cpi_accounts = token::MintTo {
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: authority.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
    token::mint_to(cpi_ctx, amount)
}

// Helper function to burn tokens with reduced stack usage and proper lifetimes
pub fn burn_tokens<'a>(
    token_program: &Program<'a, Token>,
    mint: &Account<'a, Mint>,
    from: &Account<'a, TokenAccount>,
    authority: &Signer<'a>,
    amount: u64
) -> Result<()> {
    let cpi_accounts = token::Burn {
        mint: mint.to_account_info(),
        from: from.to_account_info(),
        authority: authority.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
    token::burn(cpi_ctx, amount)
}
