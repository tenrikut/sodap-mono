use crate::error::CustomError;
use crate::state::store::Store;
use anchor_lang::prelude::*;

pub fn find_store_pda(program_id: &Pubkey, authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"store", authority.as_ref()], program_id)
}

pub fn find_escrow_pda(program_id: &Pubkey, store: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"escrow", store.as_ref()], program_id)
}

pub fn verify_store_authority(store: &Account<Store>, authority: &Signer) -> Result<()> {
    require_keys_eq!(
        store.owner,
        authority.key(),
        CustomError::Unauthorized
    );
    Ok(())
}
