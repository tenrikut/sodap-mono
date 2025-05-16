#[event]
pub struct StoreAdminRemoved {
    /// The store's address
    pub store: Pubkey,
    /// The removed admin's address
    pub admin: Pubkey,
    /// Unix timestamp when the admin was removed
    pub removed_at: i64,
}
