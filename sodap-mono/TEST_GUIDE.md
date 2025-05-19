# Sodap Program Test Guide

This document provides an overview of the test coverage for the Sodap Anchor program and instructions for running the tests.

## Test Coverage

The test suite covers the following core functionalities:

### 1. Admin Management (`admin.ts`)
- ✅ Adding platform admins
- ✅ Preventing unauthorized admin additions
- ✅ Removing platform admins
- ✅ Preventing unauthorized admin removals

### 2. User Wallet Management (`create_wallet.ts`)
- ✅ Creating user wallets
- ✅ Preventing unauthorized wallet creation
- ✅ Verifying wallet PDA derivation

### 3. Store Management (`store.ts`)
- ✅ Registering new stores
- ✅ Updating store metadata
- ✅ Preventing unauthorized store updates

### 4. Product Management (`product.ts`)
- ✅ Registering new products
- ✅ Updating product metadata
- ✅ Preventing unauthorized product updates
- ✅ Deactivating products

### 5. Payment Processing (`payment.ts`)
- ✅ Purchasing products
- ✅ Releasing funds from escrow to store owner
- ✅ Handling refunds from escrow to buyer
- ✅ Preventing unauthorized escrow operations

## Running the Tests

To run the test suite:

```bash
anchor test
```

## Test Structure

Each test file follows a similar structure:

1. **Setup**: Creates necessary accounts and initializes the test environment
2. **Test Cases**: Individual tests for each functionality
3. **Assertions**: Verifies that the operations work as expected

## Example: Testing Product Registration

```typescript
it("registers a new product", async () => {
  // Setup - Generate a unique product ID
  const productId = Keypair.generate().publicKey;
  
  // Action - Register the product
  await program.methods
    .registerProduct(
      productId,
      "Test Product",
      "Product Description",
      new BN(1000000), // 1 SOL in lamports
      new BN(10),      // 10 items in stock
      "https://example.com/product.json"
    )
    .accounts({
      store: storePda,
      authority: storeOwner.publicKey,
      payer: storeOwner.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([storeOwner])
    .rpc();
  
  // Assertion - Verify the product was registered correctly
  const productAccount = await program.account.product.fetch(productId);
  assert.equal(productAccount.name, "Test Product");
  assert.equal(productAccount.price.toNumber(), 1000000);
  assert.equal(productAccount.stock.toNumber(), 10);
});
```
