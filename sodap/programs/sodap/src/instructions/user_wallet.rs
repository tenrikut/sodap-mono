use crate::state::user::UserProfile;
use anchor_lang::prelude::*;

pub fn create_user_wallet(ctx: Context<CreateUserWallet>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let authority = &ctx.accounts.authority;

    user_profile.authority = authority.key();
    user_profile.user_id = authority.key().to_string();
    user_profile.delivery_address = String::new();
    user_profile.preferred_store = Pubkey::default();
    user_profile.total_purchases = 0;

    msg!("User wallet created with address: {}", authority.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserWallet<'info> {
    #[account(
        init,
        seeds = [b"user_wallet", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + UserProfile::LEN,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
