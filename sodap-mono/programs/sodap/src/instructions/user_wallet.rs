use crate::state::user::UserProfile;
use anchor_lang::prelude::*;

pub fn create_user_wallet(ctx: Context<CreateUserWallet>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let authority = &ctx.accounts.authority;

    // Set authority
    user_profile.authority = authority.key();

    // Convert authority pubkey to byte array for user_id
    let pubkey_bytes = authority.key().to_bytes();
    let user_id = pubkey_bytes;
    user_profile.user_id = user_id;

    // Initialize other fields
    user_profile.delivery_address = [0; 128];
    user_profile._padding1 = [0; 24];
    user_profile._padding2 = [0; 2];
    user_profile.preferred_store = Pubkey::default();
    user_profile.total_purchases = 0;

    msg!("User wallet created with address: {}", authority.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserWallet<'info> {
    #[account(
        init,
        seeds = [b"user_profile", authority.key().as_ref()],
        bump,
        payer = authority,
        space = UserProfile::LEN
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
