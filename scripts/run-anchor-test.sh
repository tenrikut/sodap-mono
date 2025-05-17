#!/bin/bash

# Clean up function to be called on script exit
cleanup() {
    echo "Cleaning up..."
    ./scripts/validator-manager.sh cleanup
}

# Register the cleanup function to be called on script exit
trap cleanup EXIT

# Kill any existing validator processes
pkill -f solana-test-validator || true
sleep 2

# Start validator with specific ports
solana-test-validator --rpc-port 8701 --faucet-port 8702 --reset &
VALIDATOR_PID=$!

# Wait for validator to start
echo "Waiting for validator to start..."
sleep 5

# Set environment variables for specific ports to match Anchor.toml
export ANCHOR_PROVIDER_URL="http://localhost:8701"
export ANCHOR_WALLET="./id.json"

# Run the actual anchor test command
echo "Running Anchor tests..."
anchor test "$@"

# Store test result
TEST_RESULT=$?

# Cleanup
kill $VALIDATOR_PID || true
wait $VALIDATOR_PID 2>/dev/null || true

exit $TEST_RESULT
