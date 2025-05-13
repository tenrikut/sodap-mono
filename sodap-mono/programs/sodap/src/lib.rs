use anchor_lang::prelude::*;
use anchor_spl::token;

// Declare the program ID used by Anchor
declare_id!("4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv");

// Module declarations without re-exports
mod error;
mod instructions;
mod state;
mod types;
mod utils;

pub use instructions::user_wallet::*;
pub use utils::pda::*;

// Define ProductAttribute type since it's not found in types.rs
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ProductAttribute {
    pub name: String,
    pub value: String,
}

// Custom error types for validation
#[error_code]
pub enum CustomError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient payment amount")]
    InsufficientPayment,
    #[msg("Invalid cart data")]
    InvalidCart,
    #[msg("Product not found")]
    ProductNotFound,
    #[msg("Insufficient stock")]
    InsufficientStock,
    #[msg("Arithmetic error")]
    ArithmeticError,
    #[msg("Insufficient escrow balance")]
    InsufficientEscrowBalance,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Insufficient loyalty points")]
    InsufficientLoyaltyPoints,
    #[msg("Invalid redemption")]
    InvalidRedemption,
}

// Define Escrow struct for payment handling
#[account]
pub struct Escrow {
    pub store: Pubkey,
    pub balance: u64,
}

// Define Store struct for our payment implementation
#[account]
pub struct Store {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub logo_uri: String,
    pub loyalty_config: types::LoyaltyConfig,
    pub is_active: bool,
    pub revenue: u64,
    pub admin_roles: Vec<state::store::AdminRole>,
}

// Define LoyaltyMint struct for token management
#[account]
pub struct LoyaltyMint {
    pub store: Pubkey,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub points_per_sol: u64,
    pub redemption_rate: u64,
    pub total_points_issued: u64,
    pub total_points_redeemed: u64,
    pub is_token2022: bool, // Flag to indicate if this is using token_interface
}

// Define Purchase struct for storing purchase records
#[account]
pub struct Purchase {
    pub product_ids: Vec<Pubkey>,
    pub quantities: Vec<u64>,
    pub total_paid: u64,
    pub gas_fee: u64,
    pub store: Pubkey,
    pub buyer: Pubkey,
    pub timestamp: i64,
}

// Declare a struct here to avoid using one from a module
#[derive(Accounts)]
pub struct RegisterStoreAccounts<'info> {
    #[account(
        init_if_needed, 
        payer = payer, 
        space = 8 + 32 + 32 + 100 + 200 + 100 + 1 + 8 + 500, 
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
pub struct PurchaseCartAccounts<'info> {
    // Store information
    #[account(mut)]
    pub store: Account<'info, Store>,

    // Receipt/Purchase record
    #[account(
        init,
        payer = buyer,
        space = 8 + 32 + (4 + 10 * 32) + (4 + 10 * 8) + 8 + 8 + 32 + 32 + 8
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
        space = 8 + 32 + 8,
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
    #[account(mut)]
    pub payer: Signer<'info>,
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
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1,
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
    pub fn register_store(
        ctx: Context<RegisterStoreAccounts>,
        name: String,
        description: String,
        logo_uri: String,
        loyalty_config: types::LoyaltyConfig,
    ) -> Result<()> {
        // Get a mutable reference to the store account
        let store = &mut ctx.accounts.store;
        let authority = &ctx.accounts.authority;

        // Set the store account fields
        store.owner = authority.key();
        store.name = name;
        store.description = description;
        store.logo_uri = logo_uri;
        store.loyalty_config = loyalty_config;
        store.is_active = true;
        store.revenue = 0;

        // Initialize admin roles with the owner as the first admin with owner role
        store.admin_roles = vec![state::store::AdminRole {
            admin_pubkey: authority.key(),
            role_type: types::AdminRoleType::Owner {},
        }];

        msg!("Store registered successfully");
        msg!("Owner: {:?}", store.owner);
        Ok(())
    }

    pub fn update_store(
        ctx: Context<UpdateStoreAccounts>,
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
        ctx: Context<CreateOrUpdateUserProfileAccounts>,
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
        ctx: Context<ScanAndPurchaseAccounts>,
        product_ids: Vec<Pubkey>,
        quantities: Vec<u64>,
        user_id: Pubkey,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Scanning and purchasing products");
        msg!("User ID: {:?}", user_id);
        msg!("Product IDs: {:?}", product_ids);
        msg!("Quantities: {:?}", quantities);
        Ok(())
    }

    // Product operations
    pub fn register_product(
        ctx: Context<RegisterProductAccounts>,
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
        ctx: Context<UpdateProductAccounts>,
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
        ctx: Context<DeactivateProductAccounts>,
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
        receipt.product_ids = product_ids.clone();
        receipt.quantities = quantities.clone();
        receipt.total_paid = total_price;
        receipt.gas_fee = 0; // For simplicity
        receipt.store = ctx.accounts.store.key();
        receipt.buyer = ctx.accounts.buyer.key();
        receipt.timestamp = Clock::get()?.unix_timestamp;

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
                let mint_authority = ctx.accounts.mint_authority.as_ref().unwrap();
                let token_program = ctx.accounts.token_program.as_ref().unwrap();

                // Create mint accounts
                let mint_accounts = anchor_spl::token::MintTo {
                    mint: token_mint.to_account_info(),
                    to: token_account.to_account_info(),
                    authority: mint_authority.to_account_info(),
                };

                // Create CPI context
                let cpi_program = token_program.to_account_info();
                let cpi_ctx = CpiContext::new(cpi_program, mint_accounts);

                // Mint tokens
                anchor_spl::token::mint_to(cpi_ctx, points)?;

                // Update total points issued
                let mut loyalty_mint = ctx.accounts.loyalty_mint_info.as_mut().unwrap();
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
            timestamp: receipt.timestamp,
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
        ctx: Context<AddPlatformAdminAccounts>,
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
        ctx: Context<RemovePlatformAdminAccounts>,
        admin_pubkey: Pubkey,
        root_password: String,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Removing platform admin: {:?}", admin_pubkey);
        msg!("Root password provided (hidden)");
        Ok(())
    }

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

        // Check if admin already exists
        if store
            .admin_roles
            .iter()
            .any(|r| r.admin_pubkey == admin_pubkey)
        {
            return Err(error::CustomError::AdminAlreadyExists.into());
        }

        // Add the admin to the store's admin_roles vector
        store.admin_roles.push(state::store::AdminRole {
            admin_pubkey,
            role_type: role,
        });

        msg!("Admin added successfully: {:?}", admin_pubkey);
        Ok(())
    }

    pub fn remove_store_admin(
        ctx: Context<RemoveStoreAdminAccounts>,
        store_id: Pubkey,
        admin_pubkey: Pubkey,
    ) -> Result<()> {
        // Simplified implementation
        msg!("Removing store admin: {:?}", admin_pubkey);
        msg!("Store ID: {:?}", store_id);
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
            let mut escrow = ctx.accounts.escrow_account.as_mut().unwrap();
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
        ctx: Context<LoyaltyTransferHookAccounts>,
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

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
