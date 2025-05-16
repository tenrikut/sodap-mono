#!/bin/bash

# Clean up function to be called on script exit
cleanup() {
    echo "Cleaning up..."
    ./scripts/validator-manager.sh stop
}

# Register the cleanup function to be called on script exit
trap cleanup EXIT

# Start the validator in test mode
./scripts/validator-manager.sh test

# Check if validator started successfully
if [ $? -ne 0 ]; then
    echo "Failed to start validator"
    exit 1
fi

# Wait a moment for validator to stabilize
sleep 5

# Run the actual anchor test command
echo "Running Anchor tests..."
anchor test "$@"

# Capture the test result
TEST_RESULT=$?

# Exit with the test result
exit $TEST_RESULT
