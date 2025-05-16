use crate::error::CustomError;
pub use crate::state::product::{
    CartPurchased, DeactivateProduct, Product, PurchaseCart, RegisterProduct, UpdateProduct,
};
use crate::state::store::Store;
use crate::state::{Escrow, RefundEscrow, ReleaseEscrow};
use crate::types::{TokenizedType, TransactionStatus};
use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

#[derive(Accounts)]
pub struct StoreEscrow<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = Escrow::DISCRIMINATOR.len() + 32 + 8, // Pubkey + balance
        seeds = [b"escrow", store.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, Escrow>,
    pub store: Account<'info, Store>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Product instructions
pub fn register_product(
    ctx: Context<RegisterProduct>,
    product_uuid: [u8; 16],
    price: u64,
    stock: u64,
    tokenized_type: TokenizedType,
    metadata_uri: String,
) -> Result<()> {
    let product = &mut ctx.accounts.product;

    // Initialize main fields
    product.uuid = product_uuid;
    product.price = price;
    product.stock = stock;
    product.tokenized_type = tokenized_type;
    product.is_active = 1;
    product.store = ctx.accounts.store.key();
    product.authority = ctx.accounts.authority.key();

    // Initialize padding fields with zeros
    product._padding = [0u8; 6];

    // Copy metadata_uri bytes with zero padding
    let mut uri_bytes = [0u8; 128];
    let metadata_bytes = metadata_uri.as_bytes();
    let len = std::cmp::min(metadata_bytes.len(), 128);
    uri_bytes[..len].copy_from_slice(&metadata_bytes[..len]);
    product.metadata_uri = uri_bytes;

    Ok(())
}

pub fn update_product(
    ctx: Context<UpdateProduct>,
    _product_uuid: [u8; 16],
    new_price: Option<u64>,
    new_stock: Option<u64>,
    new_metadata_uri: Option<String>,
    new_tokenized_type: Option<TokenizedType>,
) -> Result<()> {
    let product = &mut ctx.accounts.product;

    if let Some(price) = new_price {
        product.price = price;
    }

    if let Some(metadata_uri) = new_metadata_uri {
        let mut uri_bytes = [0u8; 128];
        let metadata_bytes = metadata_uri.as_bytes();
        let len = std::cmp::min(metadata_bytes.len(), 128);
        uri_bytes[..len].copy_from_slice(&metadata_bytes[..len]);
        product.metadata_uri = uri_bytes;
    }

    if let Some(tokenized_type) = new_tokenized_type {
        product.tokenized_type = tokenized_type;
    }

    Ok(())
}

pub fn deactivate_product(ctx: Context<DeactivateProduct>, _product_uuid: [u8; 16]) -> Result<()> {
    let product = &mut ctx.accounts.product;
    product.is_active = 0;
    Ok(())
}

/// Validate product cart items against remaining accounts and calculate total
fn validate_cart_and_payment<'a, 'b>(
    product_uuids: &'a [[u8; 16]],
    quantities: &'a [u64],
    remaining_accounts: &'b [AccountInfo<'b>],
    total_amount_paid: u64,
) -> Result<u64> {
    require!(
        product_uuids.len() == quantities.len() && !product_uuids.is_empty(),
        CustomError::InvalidCart
    );

    let mut total_price = 0u64;
    let mut i = 0;
    while i < product_uuids.len() {
        let acc_info = &remaining_accounts[i];
        let product = Account::<Product>::try_from(acc_info)?;
        require!(
            product.uuid == product_uuids[i],
            CustomError::ProductNotFound
        );
        require!(product.is_active == 1, CustomError::ProductNotFound);
        require!(
            product.stock >= quantities[i],
            CustomError::InsufficientStock
        );

        // Calculate price for this item
        let item_total = product
            .price
            .checked_mul(quantities[i])
            .ok_or(CustomError::ArithmeticError)?;
        total_price = total_price
            .checked_add(item_total)
            .ok_or(CustomError::ArithmeticError)?;

        i += 1;
    }

    // Verify payment amount matches cart total
    require!(
        total_amount_paid >= total_price,
        CustomError::InsufficientPayment
    );

    Ok(total_price)
}

pub fn purchase_cart<'info>(
    ctx: Context<'_, '_, 'info, 'info, PurchaseCart>,
    product_uuids: Vec<[u8; 16]>,
    quantities: Vec<u64>,
    total_amount_paid: u64,
    gas_fee: u64,
    status: TransactionStatus,
) -> Result<()> {
    let remaining_accounts: &'info [AccountInfo<'info>] = ctx.remaining_accounts;

    // Validate cart and get total price
    let total_price = validate_cart_and_payment(
        &product_uuids,
        &quantities,
        remaining_accounts,
        total_amount_paid,
    )?;

    // Initialize receipt with zero padding
    let receipt = &mut ctx.accounts.receipt;
    receipt.product_count = product_uuids.len() as u8;
    receipt._padding = [0u8; 7];
    receipt._padding2 = [0u8; 7];

    // Initialize arrays
    receipt.product_ids = [Pubkey::default(); 10];
    receipt.quantities = [0u64; 10];

    // Copy product IDs and quantities
    for (i, &uuid) in product_uuids.iter().enumerate().take(10) {
        if let Some(product_acc) = remaining_accounts.get(i) {
            receipt.product_ids[i] = *product_acc.key;
            receipt.quantities[i] = quantities[i];
        }
    }

    receipt.total_paid = total_price;
    receipt.gas_fee = gas_fee;
    receipt.store = ctx.accounts.store.key();
    receipt.buyer = ctx.accounts.buyer.key();
    receipt.timestamp = Clock::get()?.unix_timestamp;
    receipt.status = status as u8;

    // Transfer payment from buyer to escrow account
    let escrow_seeds = &[
        b"escrow",
        ctx.accounts.store.to_account_info().key.as_ref(),
        &[ctx.bumps.escrow_account],
    ];
    let signer_seeds = &[&escrow_seeds[..]];

    let transfer_to_escrow = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.escrow_account.to_account_info(),
        },
    );
    system_program::transfer(transfer_to_escrow, total_price)?;

    // Update escrow balance
    let escrow = &mut ctx.accounts.escrow_account;
    escrow.balance = escrow
        .balance
        .checked_add(total_price)
        .ok_or(CustomError::ArithmeticError)?;

    // Update product stocks
    let mut i = 0;
    while i < product_uuids.len() {
        let product_account = &mut Account::<Product>::try_from(&remaining_accounts[i])?;
        product_account.stock = product_account
            .stock
            .checked_sub(quantities[i])
            .ok_or(CustomError::StockUnderflow)?;
        i += 1;
    }

    let product_count = product_uuids.len() as u8;
    emit!(CartPurchased {
        store_id: ctx.accounts.store.key(),
        buyer_id: ctx.accounts.buyer.key(),
        product_uuids,
        quantities,
        total_paid: total_price,
        gas_fee,
        timestamp: receipt.timestamp,
        product_count,
    });

    Ok(())
}

pub fn release_escrow(ctx: Context<ReleaseEscrow>, amount: u64) -> Result<()> {
    let escrow_info = ctx.accounts.escrow_account.to_account_info();
    let escrow = &mut ctx.accounts.escrow_account;

    let cpi_accounts = Transfer {
        from: escrow_info,
        to: ctx.accounts.store_owner.to_account_info(),
    };

    let cpi_program = ctx.accounts.system_program.to_account_info();
    let store_key = ctx.accounts.store.key();
    let seeds = &[
        b"escrow".as_ref(),
        store_key.as_ref(),
        &[ctx.bumps.escrow_account],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    system_program::transfer(cpi_ctx, amount)?;

    escrow.balance = escrow.balance.checked_sub(amount).unwrap();

    Ok(())
}

pub fn refund_from_escrow(ctx: Context<RefundEscrow>, amount: u64) -> Result<()> {
    let escrow_info = ctx.accounts.escrow_account.to_account_info();
    let escrow = &mut ctx.accounts.escrow_account;

    let cpi_accounts = Transfer {
        from: escrow_info,
        to: ctx.accounts.buyer.to_account_info(),
    };

    let cpi_program = ctx.accounts.system_program.to_account_info();
    let store_key = ctx.accounts.store.key();
    let seeds = &[
        b"escrow".as_ref(),
        store_key.as_ref(),
        &[ctx.bumps.escrow_account],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    system_program::transfer(cpi_ctx, amount)?;

    escrow.balance = escrow.balance.checked_sub(amount).unwrap();

    Ok(())
}
