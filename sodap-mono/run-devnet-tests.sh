#!/bin/bash

echo "===== Sodap Devnet Test Runner ====="
echo "Starting tests on Solana devnet..."

# Set Anchor environment variables
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="$HOME/.config/solana/id.json"
echo "Using provider URL: $ANCHOR_PROVIDER_URL"
echo "Using wallet: $ANCHOR_WALLET"

# Check if the wallet exists
if [ ! -f "$ANCHOR_WALLET" ]; then
  echo "Error: Wallet file not found at $ANCHOR_WALLET"
  echo "Please make sure you have a Solana wallet configured with sufficient funds for testing."
  exit 1
fi

# Verify Solana CLI is installed
if ! command -v solana &> /dev/null; then
  echo "Error: Solana CLI not found. Please install it first."
  exit 1
fi

# Check wallet balance
BALANCE=$(solana balance --url $ANCHOR_PROVIDER_URL 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "Error: Could not check wallet balance. Make sure your Solana configuration is correct."
  exit 1
fi

echo "Wallet balance: $BALANCE"
echo "This wallet will be used to fund test accounts."

# Run the tests with increased timeout
echo "\nRunning tests with increased timeout (1000s)..."
echo "Tests will be executed in the following order:"
echo "1. Admin tests"
echo "2. User wallet tests"
echo "3. Store tests"
echo "4. Product tests"
echo "5. Payment tests"
echo "\n===== Test Execution Starting ====="

npx ts-mocha -p ./tsconfig.json -t 1000000 tests/admin.ts tests/create_wallet.ts tests/store.ts tests/product.ts tests/payment.ts

TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  echo "\n===== All tests completed successfully! ====="
else
  echo "\n===== Tests completed with errors. Exit code: $TEST_RESULT ====="
  echo "Check the output above for specific test failures."
fi
