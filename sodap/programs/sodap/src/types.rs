// Moved from state/types.rs
// Please add your types here, or move the content from state/types.rs

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum AdminRoleType {
    Owner,
    Manager,
    Viewer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TokenizedType {
    Digital,
    Physical,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum AnomalyFlag {
    None,
    Suspicious,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum MintStatus {
    NotMinted,
    Minted,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct LoyaltyConfig {
    pub points_per_dollar: u64,
    pub redemption_rate: u64,
}
