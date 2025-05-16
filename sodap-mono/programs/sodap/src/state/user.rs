use crate::error::CustomError;
use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};
use std::str;

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub user_id: [u8; 32],
    pub _padding1: [u8; 24],
    pub delivery_address: [u8; 128],
    pub _padding2: [u8; 2],
    pub preferred_store: Pubkey,
    pub total_purchases: u64,
}

impl Default for UserProfile {
    fn default() -> Self {
        Self {
            authority: Pubkey::default(),
            user_id: [0u8; 32],
            _padding1: [0u8; 24],
            delivery_address: [0u8; 128],
            _padding2: [0u8; 2],
            preferred_store: Pubkey::default(),
            total_purchases: 0,
        }
    }
}

#[event]
pub struct UserProfileUpdated {
    pub wallet_address: Pubkey,
    pub user_id: String,
    pub updated_at: i64,
}

impl UserProfile {
    pub const LEN: usize = 8 +    // discriminator
        32 +                      // authority: Pubkey
        32 +                      // user_id: [u8; 32]
        24 +                      // _padding1: [u8; 24]
        128 +                     // delivery_address: [u8; 128]
        2 +                       // _padding2: [u8; 2]
        32 +                      // preferred_store: Pubkey
        8; // total_purchases: u64

    pub fn validate(&self) -> Result<()> {
        // Find null terminator or end of buffer for user_id
        let user_id_len = self
            .user_id
            .iter()
            .position(|&x| x == 0)
            .unwrap_or(self.user_id.len());

        // Find null terminator or end of buffer for delivery_address
        let addr_len = self
            .delivery_address
            .iter()
            .position(|&x| x == 0)
            .unwrap_or(self.delivery_address.len());

        // Validate user_id contains valid UTF-8 up to null terminator
        require!(
            str::from_utf8(&self.user_id[..user_id_len]).is_ok(),
            CustomError::InvalidParameters
        );

        // Validate delivery_address contains valid UTF-8 up to null terminator
        require!(
            str::from_utf8(&self.delivery_address[..addr_len]).is_ok(),
            CustomError::InvalidParameters
        );

        Ok(())
    }

    pub fn get_user_id(&self) -> String {
        let nullpos = self
            .user_id
            .iter()
            .position(|&x| x == 0)
            .unwrap_or(self.user_id.len());
        String::from_utf8_lossy(&self.user_id[..nullpos]).to_string()
    }

    pub fn get_delivery_address(&self) -> String {
        let nullpos = self
            .delivery_address
            .iter()
            .position(|&x| x == 0)
            .unwrap_or(self.delivery_address.len());
        String::from_utf8_lossy(&self.delivery_address[..nullpos]).to_string()
    }

    pub fn set_user_id(&mut self, user_id: &str) -> Result<()> {
        require!(user_id.len() <= 32, CustomError::StringTooLong);
        self.user_id = [0; 32];
        self.user_id[..user_id.len()].copy_from_slice(user_id.as_bytes());
        Ok(())
    }

    pub fn set_delivery_address(&mut self, address: &str) -> Result<()> {
        require!(address.len() <= 128, CustomError::StringTooLong);
        self.delivery_address = [0; 128];
        self.delivery_address[..address.len()].copy_from_slice(address.as_bytes());
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(user_id: Option<String>, delivery_address: Option<String>, preferred_store: Option<Pubkey>)]
pub struct CreateOrUpdateUserProfile<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = UserProfile::LEN,
        seeds = [b"user_profile", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ScanAndPurchase<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub authority: Signer<'info>,
}
