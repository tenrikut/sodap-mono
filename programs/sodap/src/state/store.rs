use crate::error::*;
use crate::types::AdminRoleType;
use crate::types::LoyaltyConfig;
use anchor_lang::{prelude::*, Discriminator};
use bytemuck::{Pod, Zeroable};

#[account]
#[derive(Debug)]
pub struct Store {
    pub owner: Pubkey,
    pub name: Box<String>,
    pub description: Box<String>,
    pub logo_uri: Box<String>,
    pub loyalty_config: LoyaltyConfig,
    pub is_active: bool,
    pub revenue: u64,
    pub bump: u8,                     // bump for store PDA
    pub escrow_bump: u8,              // bump for escrow PDA
    pub admin_roles: [AdminRole; 3], // Fixed-size array
    pub admin_count: u8,              // Track number of admins
}

impl Store {
    // Using constants to make the layout clearer and maintenance easier
    pub const MAX_NAME_LEN: usize = 50;
    pub const MAX_DESC_LEN: usize = 150;
    pub const MAX_URI_LEN: usize = 50;
    pub const MAX_ADMINS: usize = 3;

    pub const LEN: usize = 8 +                        // discriminator
        32 +                        // owner (Pubkey)
        (4 + Self::MAX_NAME_LEN) +                     // name (String)
        (4 + Self::MAX_DESC_LEN) +                     // description (String)
        (4 + Self::MAX_URI_LEN) +                      // logo_uri (String)
        16 +                                           // loyalty_config (LoyaltyConfig)
        1 +                                            // is_active (bool)
        8 +                                            // revenue (u64)
        1 +                                            // bump (u8)
        1 +                                            // escrow_bump (u8)
        (32 + 1) * Self::MAX_ADMINS +                 // admin_roles [Pubkey, u8]
        1; // admin_count (u8)

    #[inline(never)]
    pub fn add_admin(&mut self, admin_role: AdminRole) -> Result<()> {
        // Validate admin count
        require!(self.admin_count < 3, CustomError::MaxAdminsReached);

        // Add new admin
        self.admin_roles[self.admin_count as usize] = admin_role;
        self.admin_count = self.admin_count.checked_add(1).unwrap();
        Ok(())
    }

    #[inline(never)]
    pub fn remove_admin(&mut self, admin_pubkey: Pubkey) -> Result<()> {
        // Cannot remove owner
        require!(
            !self.is_owner(&admin_pubkey),
            CustomError::CannotRemoveOwner
        );

        let count = self.admin_count as usize;
        for i in 0..count {
            if self.admin_roles[i].admin_pubkey == admin_pubkey {
                // Move the last element to the removed position
                if i < count - 1 {
                    self.admin_roles[i] = self.admin_roles[count - 1];
                }
                // Clear the last element
                self.admin_roles[count - 1] = AdminRole::default();
                self.admin_count = self.admin_count.saturating_sub(1);
                return Ok(());
            }
        }
        err!(CustomError::AdminNotFound)
    }

    #[inline(never)]
    pub fn is_owner(&self, user: &Pubkey) -> bool {
        self.admin_roles[0].admin_pubkey == *user
            && self.admin_roles[0].role_type == 0
    }

    #[inline(never)]
    pub fn has_role(&self, user: &Pubkey, role_type: &AdminRoleType) -> bool {
        let count = self.admin_count as usize;
        for i in 0..count {
            if self.admin_roles[i].admin_pubkey == *user {
                return self.admin_roles[i].get_role_type() == *role_type;
            }
        }
        false
    }

    #[inline(never)]
    pub fn get_admin_role(&self, admin_pubkey: Pubkey) -> Option<&AdminRole> {
        let count = self.admin_count as usize;
        for i in 0..count {
            if self.admin_roles[i].admin_pubkey == admin_pubkey {
                return Some(&self.admin_roles[i]);
            }
        }
        None
    }
}

#[derive(Debug, Clone, Copy, Default, AnchorSerialize, AnchorDeserialize)]
pub struct AdminRole {
    pub admin_pubkey: Pubkey,
    pub role_type: u8,
}

impl AdminRole {
    pub fn new(admin_pubkey: Pubkey, role_type: AdminRoleType) -> Self {
        Self {
            admin_pubkey,
            role_type: role_type as u8,
        }
    }

    pub fn get_role_type(&self) -> AdminRoleType {
        match self.role_type {
            0 => AdminRoleType::Owner {},
            1 => AdminRoleType::Manager {},
            _ => AdminRoleType::Viewer {},
        }
    }
}
