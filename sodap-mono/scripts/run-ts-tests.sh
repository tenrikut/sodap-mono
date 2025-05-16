#!/bin/bash

# Prevent recursive test execution
if [ -n "$ANCHOR_TEST_IN_PROGRESS" ]; then
    echo "Test already in progress, skipping recursive execution"
    exit 0
fi

# Set flag to prevent recursion
export ANCHOR_TEST_IN_PROGRESS=1

# Function to cleanup on exit
cleanup() {
    unset ANCHOR_TEST_IN_PROGRESS
    ./scripts/validator-manager.sh stop
}

# Register cleanup function
trap cleanup EXIT

# Start validator if not already running
if ! ./scripts/validator-manager.sh status > /dev/null 2>&1; then
    echo "Starting validator for tests..."
    ./scripts/validator-manager.sh test
    if [ $? -ne 0 ]; then
        echo "Failed to start validator"
        exit 1
    fi
    # Wait for validator to be ready
    sleep 5
fi

# Run tests using mocha
echo "Running TypeScript tests..."
mocha \
    -r ts-node/register \
    -r tsconfig-paths/register \
    --timeout 1000000 \
    "tests/**/*.ts" \
    --exit
