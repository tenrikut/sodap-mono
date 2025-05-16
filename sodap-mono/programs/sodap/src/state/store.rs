use crate::error::CustomError;
use crate::types::AdminRoleType;
use crate::types::LoyaltyConfig;
use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};

#[account]
#[derive(Debug)]
pub struct Store {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub logo_uri: String,
    pub loyalty_config: LoyaltyConfig,
    pub is_active: bool,
    pub revenue: u64,
    pub bump: u8,                     // bump for store PDA
    pub escrow_bump: u8,              // bump for escrow PDA
    pub admin_roles: [AdminRole; 10], // Fixed-size array
    pub admin_count: u8,              // Track number of admins
}

impl Store {
    pub const LEN: usize = 32 +                    // owner
        (4 + 200) +            // name
        (4 + 500) +            // description
        (4 + 200) +            // logo_uri
        16 +                   // loyalty_config
        1 +                    // is_active
        8 +                    // revenue
        1 +                    // bump
        1 +                    // escrow_bump
        (33 * 10) +           // admin_roles (fixed size array)
        1; // admin_count

    pub fn add_admin(&mut self, admin: AdminRole) -> Result<()> {
        // First check if we have space
        require!(self.admin_count < 10, CustomError::MaxAdminsReached);

        // Check if admin already exists
        for i in 0..self.admin_count {
            if self.admin_roles[i as usize].admin_pubkey == admin.admin_pubkey {
                return err!(CustomError::AdminAlreadyExists);
            }
        }

        // Add the new admin
        self.admin_roles[self.admin_count as usize] = admin;
        self.admin_count += 1;

        Ok(())
    }

    pub fn remove_admin(&mut self, admin_pubkey: Pubkey) -> Result<()> {
        // Find the admin's index
        let mut found_idx = None;
        for i in 0..self.admin_count {
            if self.admin_roles[i as usize].admin_pubkey == admin_pubkey {
                found_idx = Some(i);
                break;
            }
        }

        if let Some(idx) = found_idx {
            // Shift remaining admins forward
            for i in (idx as usize)..(self.admin_count as usize - 1) {
                self.admin_roles[i] = self.admin_roles[i + 1];
            }
            self.admin_count -= 1;
            Ok(())
        } else {
            err!(CustomError::AdminNotFound)
        }
    }

    pub fn get_admin_role(&self, admin_pubkey: Pubkey) -> Option<&AdminRole> {
        for i in 0..self.admin_count {
            if self.admin_roles[i as usize].admin_pubkey == admin_pubkey {
                return Some(&self.admin_roles[i as usize]);
            }
        }
        None
    }
}

pub fn has_role(store: &Store, user: &Pubkey, role_type: AdminRoleType) -> bool {
    for i in 0..store.admin_count {
        let admin = &store.admin_roles[i as usize];
        if admin.admin_pubkey == *user && admin.role_type == role_type {
            return true;
        }
    }
    false
}

#[derive(Debug, Clone, Copy, Default, AnchorSerialize, AnchorDeserialize, Pod, Zeroable)]
#[repr(C)]
pub struct AdminRole {
    pub admin_pubkey: Pubkey,
    pub role_type: AdminRoleType,
}
