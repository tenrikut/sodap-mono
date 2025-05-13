// User profile-related instructions, events, and accounts will be placed here.

use crate::error::CustomError;
use crate::state::user::UserProfileUpdated;
pub use crate::state::user::{CreateOrUpdateUserProfile, ScanAndPurchase};
use crate::types::*;
use anchor_lang::prelude::*;

pub fn create_or_update_user_profile(
    ctx: Context<CreateOrUpdateUserProfile>,
    user_id: Option<String>,
    delivery_address: Option<String>,
    preferred_store: Option<Pubkey>,
) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.authority = ctx.accounts.authority.key();

    if let Some(user_id) = user_id {
        user_profile.user_id = user_id.clone();
        emit!(UserProfileUpdated {
            wallet_address: ctx.accounts.authority.key(),
            user_id,
            updated_at: Clock::get()?.unix_timestamp,
        });
    }

    if let Some(delivery_address) = delivery_address {
        user_profile.delivery_address = delivery_address;
        emit!(UserProfileUpdated {
            wallet_address: ctx.accounts.authority.key(),
            user_id: user_profile.user_id.clone(),
            updated_at: Clock::get()?.unix_timestamp,
        });
    }

    if let Some(preferred_store) = preferred_store {
        user_profile.preferred_store = preferred_store;
        emit!(UserProfileUpdated {
            wallet_address: ctx.accounts.authority.key(),
            user_id: user_profile.user_id.clone(),
            updated_at: Clock::get()?.unix_timestamp,
        });
    }

    Ok(())
}

pub fn scan_and_purchase(
    ctx: Context<ScanAndPurchase>,
    product_uuids: Vec<[u8; 16]>,
    quantities: Vec<u64>,
    _store_id: Pubkey,
) -> Result<()> {
    require!(
        product_uuids.len() == quantities.len(),
        CustomError::InvalidCart
    );
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.total_purchases += 1;
    emit!(UserProfileUpdated {
        wallet_address: ctx.accounts.authority.key(),
        user_id: user_profile.user_id.clone(),
        updated_at: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
