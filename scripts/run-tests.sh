#!/bin/bash

# First, clean up any existing validator
./scripts/validator-manager.sh cleanup

# Start our validator
./scripts/validator-manager.sh start

# Wait for validator to be ready
sleep 5

# Run the tests
anchor test --skip-local-validator

# Cleanup after tests
./scripts/validator-manager.sh cleanup
