// Helper functions for authentication and authorization
use anchor_lang::prelude::*;

pub fn check_root_password(
    username: &str,
    password: &str,
    admin_username: &str,
    admin_password: &str,
) -> bool {
    // This is just a placeholder - in production you would use proper auth
    username == admin_username && password == admin_password
}

pub fn is_super_root_admin(key: &Pubkey, super_admin_pubkey: &Pubkey) -> bool {
    // Check if the key matches the super admin key
    key == super_admin_pubkey
}
