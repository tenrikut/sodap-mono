use anchor_lang::prelude::*;
use anchor_lang::Discriminator;
use anchor_spl::token;
use bytemuck::{Pod, Zeroable};
use crate::state::store::Store;
use crate::events::StoreAdminRemoved;
use crate::error::CustomError;


// Declare the program ID used by Anchor
declare_id!("4dCaSaq5kMeQntbfyGhNZ65udSataBGNZbhddFaogVfi");

// Module declarations without re-exports
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod types;
pub mod utils;

// Program-wide constants for safety limits
pub const MAX_PRODUCTS: usize = 10;
pub const MAX_STRING_LENGTH: usize = 128;
pub const MAX_ADMINS: usize = 10;
pub const MAX_LOYALTY_POINTS: u64 = u64::MAX / 2; // Prevent overflow in arithmetic

pub use instructions::user_wallet::*;
pub use utils::pda::*;

// Define ProductAttribute type 
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Pod, Zeroable, Copy)]
#[repr(C, align(8))]
pub struct ProductAttribute {
    pub name: [u8; 64],      // Changed from 50 to 64 bytes (supported by Pod)
    pub value: [u8; 128],    // Already supported size
    pub _padding: [u8; 8],   // Changed from 6 to 8 bytes (supported by Pod)
}

impl Default for ProductAttribute {
    fn default() -> Self {
        ProductAttribute {
            name: [0; 64],
            value: [0; 128],
            _padding: [0; 8],
        }
    }
}

impl ProductAttribute {
    pub const LEN: usize = 200; // 64 + 128 + 8 bytes total

    pub fn new(name: &str, value: &str) -> Result<Self> {
        require!(name.len() <= 64, CustomError::StringTooLong);
        require!(value.len() <= 128, CustomError::StringTooLong);

        let mut attr = ProductAttribute::default();
        attr.name[..name.len()].copy_from_slice(name.as_bytes());
        attr.value[..value.len()].copy_from_slice(value.as_bytes());
        Ok(attr)
    }

    pub fn get_name(&self) -> String {
        let nullpos = self.name.iter()
            .position(|&x| x == 0)
            .unwrap_or(self.name.len());
        String::from_utf8_lossy(&self.name[..nullpos]).to_string()
    }

    pub fn get_value(&self) -> String {
        let nullpos = self.value.iter()
            .position(|&x| x == 0)
            .unwrap_or(self.value.len());
        String::from_utf8_lossy(&self.value[..nullpos]).to_string()
    }
}

// Define Escrow struct for payment handling
#[account]
#[derive(Copy, Pod, Zeroable)]
#[repr(C)]
pub struct Escrow {
    pub store: Pubkey,
    pub balance: u64,
}

impl Escrow {
    pub const LEN: usize = Escrow::DISCRIMINATOR.len() + 32 + 8;
}

// Define LoyaltyMint struct for token management
#[account]
#[derive(Debug, Default)]
pub struct LoyaltyMint {
    pub store: Pubkey,           // 32 bytes
    pub mint: Pubkey,           // 32 bytes
    pub authority: Pubkey,      // 32 bytes
    pub points_per_sol: u64,    // 8 bytes
    pub redemption_rate: u64,   // 8 bytes
    pub total_points_issued: u64,     // 8 bytes
    pub total_points_redeemed: u64,   // 8 bytes
    pub is_token2022: bool,     // 1 byte
}

impl LoyaltyMint {
    pub const LEN: usize = LoyaltyMint::DISCRIMINATOR.len() + 
        32 +   // store
        32 +   // mint
        32 +   // authority
        8 +    // points_per_sol
        8 +    // redemption_rate
        8 +    // total_points_issued
        8 +    // total_points_redeemed
        1;     // is_token2022
}

use crate::state::product::Purchase;

// Declare a struct here to avoid using one from a module
#[derive(Accounts)]
pub struct RegisterStoreAccounts<'info> {
    #[account(
        init_if_needed, 
        payer = payer,
        space = Store::DISCRIMINATOR.len() + Store::LEN,
        seeds = [b"store", authority.key().as_ref()], 
        bump
    )]
    pub store: Account<'info, Store>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStoreAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateOrUpdateUserProfileAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ScanAndPurchaseAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterProductAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProductAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeactivateProductAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Add a new struct for emitting purchase events
#[event]
pub struct PurchaseCompleted {
    pub store: Pubkey,
    pub buyer: Pubkey,
    pub total_amount: u64,
    pub timestamp: i64,
    pub loyalty_points_earned: u64,
}

#[derive(Accounts)]
#[instruction(purchase_tag: u8)]
pub struct PurchaseCartAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // Receipt/Purchase record
    #[account(
        init,
        payer = buyer,
        space = Purchase::DISCRIMINATOR.len() + 32 + (32 * 10) + (8 * 10) + 1 + 8 + 8 + 32 + 32 + 8,
        seeds = [b"purchase", buyer.key().as_ref(), &[purchase_tag]],
        bump
    )]
    pub receipt: Account<'info, Purchase>,

    // The buyer who is paying for the cart
    #[account(mut)]
    pub buyer: Signer<'info>,

    // The store owner who will receive payment
    #[account(mut)]
    /// CHECK: This is not dangerous because we're only using it for payment
    pub store_owner: AccountInfo<'info>,

    // The escrow account that holds funds during the purchase
    #[account(
        init_if_needed,
        payer = buyer,
        space = Escrow::DISCRIMINATOR.len() + 32 + 8,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, Escrow>,

    // --- Optional loyalty accounts ---

    // Loyalty mint info account (optional - only if store has loyalty enabled)
    #[account(
        mut,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump,
    )]
    pub loyalty_mint_info: Option<Account<'info, LoyaltyMint>>,

    // Token mint (optional - only if loyalty is enabled)
    #[account(mut)]
    pub token_mint: Option<Account<'info, anchor_spl::token::Mint>>,

    // Token account to receive loyalty points (optional)
    #[account(mut)]
    pub token_account: Option<Account<'info, anchor_spl::token::TokenAccount>>,

    // Mint authority (optional - only if loyalty is enabled)
    #[account(mut)]
    pub mint_authority: Option<Signer<'info>>,

    // Token program (optional - only if loyalty is enabled)
    pub token_program: Option<Program<'info, anchor_spl::token::Token>>,

    // Required programs
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddPlatformAdminAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemovePlatformAdminAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddStoreAdminAccounts<'info> {
    #[account(mut)]
    pub store: Account<'info, Store>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveStoreAdminAccounts<'info> {
    #[account(
        mut,
        seeds = [b"store", authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    /// The authority must be the store owner
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeLoyaltyMintAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // Loyalty mint account to track points
    #[account(
        init,
        payer = payer,
        space = LoyaltyMint::DISCRIMINATOR.len() + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump
    )]
    pub loyalty_mint_account: Account<'info, LoyaltyMint>,

    // The actual SPL token mint
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = payer,
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    // Authority that will control the mint
    #[account(mut)]
    pub payer: Signer<'info>,

    // Required programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintLoyaltyTokensAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // Loyalty mint account
    #[account(
        mut,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump,
        constraint = loyalty_mint_account.store == store.key() @ CustomError::Unauthorized
    )]
    pub loyalty_mint_account: Account<'info, LoyaltyMint>,

    // SPL token mint using Token interface
    #[account(
        mut,
        address = loyalty_mint_account.mint @ CustomError::InvalidMint
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    // The token account to receive the minted tokens
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = recipient,
    )]
    pub token_account: Account<'info, anchor_spl::token::TokenAccount>,

    // Mint authority for the loyalty token
    #[account(
        mut,
        constraint = mint_authority.key() == loyalty_mint_account.authority @ CustomError::Unauthorized
    )]
    pub mint_authority: Signer<'info>,

    // The user who will receive the tokens
    /// CHECK: This account is just used for token account validation
    pub recipient: AccountInfo<'info>,

    // The user who made the purchase (for calculating loyalty points)
    /// CHECK: This account is just for logging who earned the points
    pub buyer: AccountInfo<'info>,

    // Required programs
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemLoyaltyPointsAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // Loyalty mint account
    #[account(
        mut,
        seeds = [b"loyalty_mint", store.key().as_ref()],
        bump,
        constraint = loyalty_mint_account.store == store.key() @ CustomError::Unauthorized
    )]
    pub loyalty_mint_account: Account<'info, LoyaltyMint>,

    // SPL token mint
    #[account(
        mut,
        address = loyalty_mint_account.mint @ CustomError::InvalidMint
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    // The token account that will have tokens burned
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = user,
    )]
    pub token_account: Account<'info, anchor_spl::token::TokenAccount>,

    // The user redeeming points
    pub user: Signer<'info>,

    // Escrow account (for receiving SOL if points are redeemed for SOL)
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Option<Account<'info, Escrow>>,

    // Required programs
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LoyaltyTransferHookAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrowAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // The store owner who receives funds
    #[account(
        mut,
        constraint = store_owner.key() == store.owner @ CustomError::Unauthorized
    )]
    pub store_owner: Signer<'info>,

    // The escrow account that holds funds
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump,
        constraint = escrow_account.store == store.key() @ CustomError::Unauthorized
    )]
    pub escrow_account: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundEscrowAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // Store owner authorizing the refund
    #[account(
        constraint = store_owner.key() == store.owner @ CustomError::Unauthorized
    )]
    pub store_owner: Signer<'info>,

    // The buyer who receives the refund
    #[account(mut)]
    /// CHECK: This is not dangerous because we're only sending funds to this account
    pub buyer: AccountInfo<'info>,

    // The escrow account that holds funds
    #[account(
        mut,
        seeds = [b"escrow", store.key().as_ref()],
        bump,
        constraint = escrow_account.store == store.key() @ CustomError::Unauthorized
    )]
    pub escrow_account: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[program]
pub mod sodap {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized by: {:?}", ctx.accounts.payer.key());
        Ok(())
    }

    pub fn create_user_wallet(ctx: Context<CreateUserWallet>) -> Result<()> {
        instructions::user_wallet::create_user_wallet(ctx)
    }

    // Store-related instruction
    #[inline(never)]
    pub fn register_store(
        ctx: Context<RegisterStoreAccounts>,
        name: String,
        description: String,
        logo_uri: String,
        loyalty_config: types::LoyaltyConfig,
    ) -> Result<()> {
        validate_store_registration(&name, &description, &logo_uri, &loyalty_config)?;

        initialize_store(
            &mut ctx.accounts.store,
            &ctx.accounts.authority,
            name,
            description,
            logo_uri,
            loyalty_config,
            ctx.bumps.store,
        )?;

        msg!("Store registered successfully");
        msg!("Owner: {:?}", ctx.accounts.store.owner);
        Ok(())
    }

    #[inline(never)]
    pub fn update_store(
        _ctx: Context<UpdateStoreAccounts>,
        store_id: Pubkey,
        name: Option<String>,
        description: Option<String>,
        logo_uri: Option<String>,
        loyalty_config: Option<types::LoyaltyConfig>,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Updating store: {:?}", store_id);
        if let Some(name) = name {
            msg!("New store name: {}", name);
        }
        if let Some(description) = description {
            msg!("New store description: {}", description);
        }
        if let Some(logo_uri) = logo_uri {
            msg!("New store logo URI: {}", logo_uri);
        }
        if let Some(loyalty_config) = loyalty_config {
            msg!("New store loyalty config: {:?}", loyalty_config);
        }
        Ok(())
    }

    // User profile operations
    pub fn create_or_update_user_profile(
        _ctx: Context<CreateOrUpdateUserProfileAccounts>,
        user_id: Option<Pubkey>,
        name: Option<String>,
        email: Option<String>,
        phone: Option<String>,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Creating or updating user profile");
        if let Some(user_id) = user_id {
            msg!("User ID: {:?}", user_id);
        }
        if let Some(name) = name {
            msg!("Name: {}", name);
        }
        if let Some(email) = email {
            msg!("Email: {}", email);
        }
        if let Some(phone) = phone {
            msg!("Phone: {}", phone);
        }
        Ok(())
    }

    pub fn scan_and_purchase(
        _ctx: Context<ScanAndPurchaseAccounts>,
        product_ids: Vec<Pubkey>,
        quantities: Vec<u64>,
        _store_id: Pubkey,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Scanning and purchasing products");
        msg!("Product IDs: {:?}", product_ids);
        msg!("Quantities: {:?}", quantities);
        Ok(())
    }

    // Product operations
    pub fn register_product(
        _ctx: Context<RegisterProductAccounts>,
        product_id: Pubkey,
        store_id: Pubkey,
        name: String,
        description: String,
        image_uri: String,
        price: u64,
        inventory: Option<u64>,
        attributes: Vec<ProductAttribute>,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Registering product: {:?}", product_id);
        msg!("Store ID: {:?}", store_id);
        msg!("Name: {}", name);
        msg!("Description: {}", description);
        msg!("Image URI: {}", image_uri);
        msg!("Price: {}", price);
        if let Some(inventory) = inventory {
            msg!("Inventory: {}", inventory);
        }
        msg!("Attributes: {:?}", attributes);
        Ok(())
    }

    pub fn update_product(
        _ctx: Context<UpdateProductAccounts>,
        product_id: Pubkey,
        name: Option<String>,
        description: Option<String>,
        image_uri: Option<String>,
        price: Option<u64>,
        inventory: Option<u64>,
        attributes: Option<Vec<ProductAttribute>>,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Updating product: {:?}", product_id);
        if let Some(name) = name {
            msg!("New name: {}", name);
        }
        if let Some(description) = description {
            msg!("New description: {}", description);
        }
        if let Some(image_uri) = image_uri {
            msg!("New image URI: {}", image_uri);
        }
        if let Some(price) = price {
            msg!("New price: {}", price);
        }
        if let Some(inventory) = inventory {
            msg!("New inventory: {}", inventory);
        }
        if let Some(attributes) = attributes {
            msg!("New attributes: {:?}", attributes);
        }
        Ok(())
    }

    pub fn deactivate_product(
        _ctx: Context<DeactivateProductAccounts>,
        product_id: Pubkey,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Deactivating product: {:?}", product_id);
        Ok(())
    }

    pub fn purchase_cart(
        ctx: Context<PurchaseCartAccounts>,
        product_ids: Vec<Pubkey>,
        quantities: Vec<u64>,
        total_amount_paid: u64,
    ) -> Result<()> {
        // Validate cart data
        require!(
            product_ids.len() == quantities.len() && !product_ids.is_empty(),
            CustomError::InvalidCart
        );
        
        // Validate cart size against MAX_PRODUCTS
        require!(
            product_ids.len() <= MAX_PRODUCTS,
            CustomError::CartTooLarge
        );
        
        // Validate quantities don't overflow
        let mut total_quantity: u64 = 0;
        for qty in quantities.iter() {
            total_quantity = total_quantity.checked_add(*qty)
                .ok_or(CustomError::ArithmeticError)?;
        }

        // Calculate total price (in real implementation, you would validate product prices)
        // For simplicity, we're assuming total_amount_paid is correct
        let total_price = total_amount_paid;

        // Transfer payment from buyer to escrow account
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
            },
        );

        anchor_lang::system_program::transfer(cpi_context, total_price)?;

        // Get current escrow balance before updating
        let escrow_balance = ctx.accounts.escrow_account.balance;

        // Update escrow account
        ctx.accounts.escrow_account.store = ctx.accounts.store.key();
        ctx.accounts.escrow_account.balance = escrow_balance
            .checked_add(total_price)
            .ok_or(CustomError::ArithmeticError)?;

        // Update receipt
        let receipt = &mut ctx.accounts.receipt;
        receipt.product_ids = product_ids.clone().try_into().unwrap_or([Pubkey::default(); 10]);
        receipt.quantities = quantities.clone().try_into().unwrap_or([0; 10]);
               receipt.product_count = product_ids.len() as u8;
        receipt.total_paid = total_price;
        receipt.gas_fee = 0; // For simplicity
        receipt.store = ctx.accounts.store.key();
        receipt.buyer = ctx.accounts.buyer.key();

        // Calculate loyalty points earned (if loyalty is enabled)
        let loyalty_points_earned = if ctx.accounts.loyalty_mint_info.is_some()
            && ctx.accounts.token_account.is_some()
            && ctx.accounts.token_mint.is_some()
            && ctx.accounts.mint_authority.is_some()
            && ctx.accounts.token_program.is_some()
        {
            // Get points per SOL from loyalty config
            let loyalty_mint_info = ctx.accounts.loyalty_mint_info.as_ref().unwrap();
            let points_per_sol = loyalty_mint_info.points_per_sol;

            // Calculate SOL amount (convert lamports to SOL)
            let purchase_amount_sol = total_price
                .checked_div(1_000_000_000)
                .ok_or(CustomError::ArithmeticError)?;

            // Calculate points earned
            let points = points_per_sol
                .checked_mul(purchase_amount_sol)
                .ok_or(CustomError::ArithmeticError)?
                .checked_mul(1_000_000) // Adjust for 6 decimal places in the token
                .ok_or(CustomError::ArithmeticError)?;

            if points > 0 {
                // Get references to all required accounts
                let token_mint = ctx.accounts.token_mint.as_ref().unwrap();
                let token_account = ctx.accounts.token_account.as_ref().unwrap();
                let token_program = ctx.accounts.token_program.as_ref().unwrap();

                // Create mint accounts
                let mint_accounts = anchor_spl::token::MintTo {
                    mint: token_mint.to_account_info(),
                    to: token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.as_ref().unwrap().to_account_info(),               };

                // Create CPI context
                let cpi_program = token_program.to_account_info();
                let cpi_ctx = CpiContext::new(cpi_program, mint_accounts);

                // Mint tokens
                anchor_spl::token::mint_to(cpi_ctx, points)?;

                // Update total points issued
                let loyalty_mint = ctx.accounts.loyalty_mint_info.as_mut().unwrap();
                loyalty_mint.total_points_issued = loyalty_mint
                    .total_points_issued
                    .checked_add(points)
                    .ok_or(CustomError::ArithmeticError)?;

                msg!("Earned {} loyalty points for purchase", points);
                points
            } else {
                0
            }
        } else {
            0
        };

        // Emit purchase event
        emit!(PurchaseCompleted {
            store: ctx.accounts.store.key(),
            buyer: ctx.accounts.buyer.key(),
            total_amount: total_price,
            timestamp: Clock::get()?.unix_timestamp,
            loyalty_points_earned,
        });

        // Log purchase
        msg!("Purchase completed - Total paid: {}", total_price);
        msg!(
            "Funds held in escrow: {}",
            ctx.accounts.escrow_account.balance
        );

        if loyalty_points_earned > 0 {
            msg!("Loyalty points earned: {}", loyalty_points_earned);
        }

        Ok(())
    }

    // Admin operations
    pub fn add_platform_admin(
        _ctx: Context<AddPlatformAdminAccounts>,
        admin_pubkey: Pubkey,
        admin_name: String,
        root_password: String,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Adding platform admin: {:?}", admin_pubkey);
        msg!("Admin name: {}", admin_name);
        msg!("Root password provided (hidden)");
        Ok(())
    }

    pub fn remove_platform_admin(
        _ctx: Context<RemovePlatformAdminAccounts>,
        admin_pubkey: Pubkey,
        root_password: String,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Removing platform admin: {:?}", admin_pubkey);
        msg!("Root password provided (hidden)");
        Ok(())
    }

    #[inline(never)]
    pub fn add_store_admin(
        ctx: Context<AddStoreAdminAccounts>,
        store_id: Pubkey,
        admin_pubkey: Pubkey,
        role: types::AdminRoleType,
    ) -> Result<()> {
        // Get a mutable reference to the store account
        let store = &mut ctx.accounts.store;
        let authority = &ctx.accounts.authority;

        // Check that the authority is the store owner
        require!(
            authority.key() == store.owner,
            error::CustomError::Unauthorized
        );
        require!(authority.is_signer, error::CustomError::Unauthorized);
        
        // Check if we have space for a new admin
        require!(
            store.admin_count < 10,
            CustomError::Unauthorized
        );

        // Check if admin already exists
        for i in 0..store.admin_count {
            if store.admin_roles[i as usize].admin_pubkey == admin_pubkey {
                return Err(error::CustomError::AdminAlreadyExists.into());
            }
        }

        // Add the new admin
        let admin_index = store.admin_count as usize;
        let admin_role = state::store::AdminRole::new(admin_pubkey, role);
        store.admin_roles[admin_index] = admin_role;
        store.admin_count += 1;

        msg!("Admin added successfully: {:?}", admin_pubkey);
        Ok(())
    }

    #[inline(never)]
    pub fn remove_store_admin(
        ctx: Context<RemoveStoreAdminAccounts>, 
        store_id: Pubkey,
        admin_pubkey: Pubkey,
    ) -> Result<()> {
        let store = &mut ctx.accounts.store;
        let authority = &ctx.accounts.authority;

        // Verify authority is the store owner
        require!(
            authority.key() == store.owner,
            error::CustomError::Unauthorized
        );

        // Verify the admin exists and get their role
        let admin_role = store.get_admin_role(admin_pubkey)
            .ok_or(error::CustomError::AdminNotFound)?;

        // Prevent owner removal
        require!(
            !matches!(admin_role.get_role_type(), types::AdminRoleType::Owner {}),
            error::CustomError::CannotRemoveOwner
        );

        // Remove the admin
        store.remove_admin(admin_pubkey)?;

        msg!("Store admin removed successfully: {:?}", admin_pubkey);
        
        // Emit an event that the admin was removed
        emit!(StoreAdminRemoved {
            store: store_id,
            admin: admin_pubkey,
            removed_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Loyalty operations
    pub fn initialize_loyalty_mint(
        ctx: Context<InitializeLoyaltyMintAccounts>,
        points_per_sol: u64,
        redemption_rate: u64,
        use_token2022: bool, // Flag for future Token-2022 compatibility
    ) -> Result<()> {
        // Initialize the loyalty mint tracking account
        let loyalty_mint = &mut ctx.accounts.loyalty_mint_account;
        loyalty_mint.store = ctx.accounts.store.key();
        loyalty_mint.mint = ctx.accounts.token_mint.key();
        loyalty_mint.authority = ctx.accounts.payer.key();
        loyalty_mint.points_per_sol = points_per_sol;
        loyalty_mint.redemption_rate = redemption_rate;
        loyalty_mint.total_points_issued = 0;
        loyalty_mint.total_points_redeemed = 0;
        loyalty_mint.is_token2022 = use_token2022; // Save for future Token-2022 implementation

        msg!(
            "Initialized loyalty mint for store: {}",
            ctx.accounts.store.key()
        );
        msg!("Points per SOL: {}", points_per_sol);
        msg!("Redemption rate: {}", redemption_rate);
        msg!("Mint address: {}", ctx.accounts.token_mint.key());
        if use_token2022 {
            msg!("Token-2022 support is marked for future implementation");
        }

        Ok(())
    }

    pub fn mint_loyalty_points(
        ctx: Context<MintLoyaltyTokensAccounts>,
        purchase_amount_lamports: u64,
    ) -> Result<()> {
        // Calculate how many loyalty points to mint based on purchase amount
        let loyalty_mint = &mut ctx.accounts.loyalty_mint_account;

        // Convert lamports to SOL (1 SOL = 1_000_000_000 lamports)
        let purchase_amount_sol = purchase_amount_lamports
            .checked_div(1_000_000_000)
            .ok_or(CustomError::ArithmeticError)?;

        // Calculate points to mint (points_per_sol * purchase_amount_sol)
        // For decimal precision, we use the token's decimal places (6)
        let points_to_mint = loyalty_mint
            .points_per_sol
            .checked_mul(purchase_amount_sol)
            .ok_or(CustomError::ArithmeticError)?
            .checked_mul(1_000_000) // Adjust for 6 decimal places in the token
            .ok_or(CustomError::ArithmeticError)?;

        // Check if points were calculated (zero check)
        require!(points_to_mint > 0, CustomError::ArithmeticError);

        // Mint tokens to the user's token account
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, points_to_mint)?;

        // Update loyalty mint accounting
        loyalty_mint.total_points_issued = loyalty_mint
            .total_points_issued
            .checked_add(points_to_mint)
            .ok_or(CustomError::ArithmeticError)?;

        // Log the operation
        msg!(
            "Minted {} loyalty points for purchase of {} SOL",
            points_to_mint,
            purchase_amount_sol
        );
        msg!("Recipient: {}", ctx.accounts.recipient.key());
        msg!(
            "Total points issued by store: {}",
            loyalty_mint.total_points_issued
        );

        Ok(())
    }

    pub fn redeem_loyalty_points(
        ctx: Context<RedeemLoyaltyPointsAccounts>,
        points_to_redeem: u64,
        redeem_for_sol: bool,
    ) -> Result<()> {
        // Validate points don't exceed maximum
        require!(
            points_to_redeem <= MAX_LOYALTY_POINTS,
            CustomError::LoyaltyPointsOverflow
        );

        // Get loyalty mint and validate redemption
        let loyalty_mint = &mut ctx.accounts.loyalty_mint_account;

        // Check if user has enough tokens to redeem
        let user_token_balance = ctx.accounts.token_account.amount;
        require!(
            user_token_balance >= points_to_redeem,
            CustomError::InsufficientLoyaltyPoints
        );

        // Calculate SOL value if redeeming for SOL
        // Formula: (points_to_redeem / 1_000_000) / redemption_rate = SOL amount
        let sol_value = if redeem_for_sol {
            // Points have 6 decimal places, so divide by 1_000_000 to get the whole points
            let whole_points = points_to_redeem
                .checked_div(1_000_000)
                .ok_or(CustomError::ArithmeticError)?;

            // Calculate SOL value based on redemption rate
            // (e.g., if redemption_rate is 100, then 100 points = 1 SOL)
            whole_points
                .checked_div(loyalty_mint.redemption_rate)
                .ok_or(CustomError::ArithmeticError)?
                .checked_mul(1_000_000_000) // Convert to lamports
                .ok_or(CustomError::ArithmeticError)?
        } else {
            0 // Not redeeming for SOL
        };

        // Burn the loyalty tokens
        let cpi_accounts = token::Burn {
            mint: ctx.accounts.token_mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, points_to_redeem)?;

        // If redeeming for SOL, transfer from escrow to user
        if redeem_for_sol {
            // Ensure escrow account is provided
            require!(
                ctx.accounts.escrow_account.is_some(),
                CustomError::InvalidRedemption
            );

            let escrow_account = ctx.accounts.escrow_account.as_ref().unwrap();

            // Verify escrow has enough balance
            require!(
                escrow_account.balance >= sol_value,
                CustomError::InsufficientEscrowBalance
            );

            // Get escrow account PDA signer seeds
            let store_key = ctx.accounts.store.key();
            let escrow_seeds = &[
                b"escrow".as_ref(),
                store_key.as_ref(),
                &[255], // Using a default bump value
            ];

            // Create signer seeds array
            let signer_seeds = &[&escrow_seeds[..]];

            // Transfer SOL from escrow to user
            let cpi_accounts = anchor_lang::system_program::Transfer {
                from: escrow_account.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            };

            let cpi_program = ctx.accounts.system_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

            anchor_lang::system_program::transfer(cpi_ctx, sol_value)?;

            // Update escrow balance
            let escrow = ctx.accounts.escrow_account.as_mut().unwrap();
            escrow.balance = escrow.balance.checked_sub(sol_value).unwrap();

            msg!(
                "Redeemed {} loyalty points for {} SOL",
                points_to_redeem,
                sol_value / 1_000_000_000
            );
        } else {
            msg!(
                "Redeemed {} loyalty points for store products/services",
                points_to_redeem
            );
        }

        // Update loyalty mint accounting
        loyalty_mint.total_points_redeemed = loyalty_mint
            .total_points_redeemed
            .checked_add(points_to_redeem)
            .ok_or(CustomError::ArithmeticError)?;

        msg!(
            "Total points redeemed at store: {}",
            loyalty_mint.total_points_redeemed
        );

        Ok(())
    }

    pub fn handle_transfer_hook(
        _ctx: Context<LoyaltyTransferHookAccounts>,
        amount: u64,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Handling loyalty transfer hook for amount: {}", amount);
        Ok(())
    }

    // Function to release funds from escrow to store owner
    pub fn release_escrow(ctx: Context<ReleaseEscrowAccounts>, amount: u64) -> Result<()> {
        // Check if escrow has enough balance
        let escrow_balance = ctx.accounts.escrow_account.balance;
        require!(
            escrow_balance >= amount,
            CustomError::InsufficientEscrowBalance
        );

        // Get PDA signer seeds for escrow account
        let store_key = ctx.accounts.store.key();
        let escrow_seeds = &[
            b"escrow".as_ref(),
            store_key.as_ref(),
            &[255], // Using a default bump value
        ];

        // Create signer seeds array
        let signer_seeds = &[&escrow_seeds[..]];

        // Transfer from escrow to store owner
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.escrow_account.to_account_info(),
            to: ctx.accounts.store_owner.to_account_info(),
        };

        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update escrow balance
        ctx.accounts.escrow_account.balance = escrow_balance.checked_sub(amount).unwrap();

        // Log the release
        msg!("Released {} lamports from escrow to store owner", amount);
        msg!(
            "Remaining escrow balance: {}",
            ctx.accounts.escrow_account.balance
        );

        Ok(())
    }

    // Function to refund funds from escrow to buyer
    pub fn refund_from_escrow(ctx: Context<RefundEscrowAccounts>, amount: u64) -> Result<()> {
        // Check if escrow has enough balance
        let escrow_balance = ctx.accounts.escrow_account.balance;
        require!(
            escrow_balance >= amount,
            CustomError::InsufficientEscrowBalance
        );

        // Get PDA signer seeds for escrow account
        let store_key = ctx.accounts.store.key();
        let escrow_seeds = &[
            b"escrow".as_ref(),
            store_key.as_ref(),
            &[255], // Using a default bump value
        ];

        // Create signer seeds array
        let signer_seeds = &[&escrow_seeds[..]];

        // Transfer from escrow to buyer (refund)
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.escrow_account.to_account_info(),
            to: ctx.accounts.buyer.to_account_info(),
        };

        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update escrow balance
        ctx.accounts.escrow_account.balance = escrow_balance.checked_sub(amount).unwrap();

        // Log the refund
        msg!("Refunded {} lamports from escrow to buyer", amount);
        msg!(
            "Remaining escrow balance: {}",
            ctx.accounts.escrow_account.balance
        );

        Ok(())
    }
}

#[inline(never)]
fn validate_store_registration(
    name: &str,
    description: &str,
    logo_uri: &str,
    _loyalty_config: &types::LoyaltyConfig,
) -> Result<()> {
    // Validate string lengths
    require!(
        name.len() <= state::store::Store::MAX_NAME_LEN,
        CustomError::InvalidParameters
    );
    require!(
        description.len() <= state::store::Store::MAX_DESC_LEN,
        CustomError::InvalidParameters
    );
    require!(
        logo_uri.len() <= state::store::Store::MAX_URI_LEN,
        CustomError::InvalidParameters
    );
    Ok(())
}

#[inline(never)]
fn initialize_store(
    store: &mut Account<Store>,
    authority: &Signer,
    name: String,
    description: String,
    logo_uri: String,
    loyalty_config: types::LoyaltyConfig,
    bump: u8,
) -> Result<()> {
    store.owner = authority.key();
    store.name = Box::new(name);
    store.description = Box::new(description);
    store.logo_uri = Box::new(logo_uri);
    store.loyalty_config = loyalty_config;
    store.is_active = true;
    store.revenue = 0;
    store.bump = bump;
    store.escrow_bump = 255; // Will be set when escrow is created
    store.admin_roles = [state::store::AdminRole::default(); 3];
    store.admin_count = 1;
    store.admin_roles[0] = state::store::AdminRole::new(
        authority.key(),
        types::AdminRoleType::Owner {}
    );
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
