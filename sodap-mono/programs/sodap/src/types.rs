use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Default)]
#[repr(u8)]
pub enum AdminRoleType {
    Owner = 0,
    Manager = 1,
    #[default]
    Viewer = 2,
}

unsafe impl Pod for AdminRoleType {}
unsafe impl Zeroable for AdminRoleType {}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Default)]
#[repr(u8)]
pub enum TokenizedType {
    #[default]
    NonTokenized = 0,
    Digital = 1,
    Physical = 2,
}

unsafe impl Pod for TokenizedType {}
unsafe impl Zeroable for TokenizedType {}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Default)]
#[repr(u8)]
pub enum TransactionStatus {
    #[default]
    Pending = 0,
    Completed = 1,
    Failed = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Default)]
#[repr(u8)]
pub enum AnomalyFlag {
    #[default]
    None = 0,
    Suspicious = 1,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Default)]
#[repr(u8)]
pub enum MintStatus {
    #[default]
    NotMinted = 0,
    Minted = 1,
}

#[derive(
    AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Default, Pod, Zeroable,
)]
#[repr(C)]
pub struct LoyaltyConfig {
    pub points_per_dollar: u64,
    pub redemption_rate: u64,
}
