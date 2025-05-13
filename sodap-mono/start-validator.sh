#!/bin/bash

# Kill any existing Solana processes more aggressively
echo "Stopping any existing Solana validator processes..."
pkill -9 -f solana-test-validator || true
pkill -9 -f solana || true

# Clean up any leftover files
if [ -d "test-ledger" ]; then
  echo "Removing old test ledger..."
  rm -rf test-ledger
fi

# Wait a moment for processes to shut down and ports to be released
sleep 3

# Try to start on port 8999
echo "Starting a new validator on port 8999..."
solana-test-validator --reset --rpc-port 8999 &

# Wait for validator to start
echo "Waiting for validator to start..."
sleep 10

# Set config to use the new port
echo "Configuring Solana to use port 8999..."
solana config set --url http://localhost:8999

echo "Done! Validator is running on port 8999"
echo "To verify it's working, run: solana epoch-info" 