#!/bin/bash
# Script to run a single test file on devnet

echo "===== Sodap Devnet Single Test Runner ====="
echo "Starting test on Solana devnet: $1"

# Set Anchor environment variables
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="$HOME/.config/solana/id.json"
echo "Using provider URL: $ANCHOR_PROVIDER_URL"
echo "Using wallet: $ANCHOR_WALLET"

# Check if a test file was provided
if [ -z "$1" ]; then
  echo "Error: No test file specified"
  echo "Usage: ./run-single-test.sh tests/admin.ts"
  exit 1
fi

# Check if the test file exists
if [ ! -f "$1" ]; then
  echo "Error: Test file not found: $1"
  exit 1
fi

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

# Run the specific test file with increased timeout
echo "\nRunning test with increased timeout (1000s)..."
echo "Test file: $1"
echo "\n===== Test Execution Starting ====="

npx ts-mocha -p ./tsconfig.json -t 1000000 "$1"

TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  echo "\n===== Test completed successfully! ====="
else
  echo "\n===== Test completed with errors. Exit code: $TEST_RESULT ====="
  echo "Check the output above for specific test failures."
fi
