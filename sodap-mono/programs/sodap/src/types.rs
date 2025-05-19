// Moved from state/types.rs
// Please add your types here, or move the content from state/types.rs

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum AdminRoleType {
    Owner,
    Manager,
    Viewer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TokenizedType {
    NonFungible,
    Fungible,
    None,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum AnomalyFlag {
    None,
    Suspicious,
}
