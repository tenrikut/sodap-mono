#!/bin/bash

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0    # Port is in use
    else
        return 1    # Port is free
    fi
}

# Function to find a free port starting from base_port
find_free_port() {
    local base_port=$1
    local max_attempts=10
    local port=$base_port
    
    for (( i=0; i<max_attempts; i++ )); do
        if ! check_port $port; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    
    echo "0"  # No free port found
    return 1
}

# Function to cleanup existing validator processes
cleanup_validator() {
    echo "Cleaning up existing Solana validator processes..."
    # Kill all existing validator processes
    pkill -9 -f solana-test-validator 2>/dev/null || true
    pkill -f validator.sh 2>/dev/null || true
    pkill -f "solana-faucet" 2>/dev/null || true
    
    # Remove test ledger
    rm -rf test-ledger/
    
    # Wait for processes to fully terminate
    sleep 2
    
    # Verify ports are free
    if check_port 8899; then
        echo "Warning: Port 8899 is still in use. Waiting for cleanup..."
        sleep 5
        if check_port 8899; then
            echo "Error: Unable to free port 8899"
            exit 1
        fi
    fi
}

# Function to start the validator
start_validator() {
    local rpc_port=8899
    local faucet_port=9900
    
    echo "Starting validator on port $rpc_port..."
    
    # Create test ledger directory if it doesn't exist
    mkdir -p test-ledger
    
    # Start the validator
    solana-test-validator \
        --reset \
        --ledger test-ledger \
        --rpc-port $rpc_port \
        > validator.log 2>&1 &
    
    # Wait for validator to start
    echo "Waiting for validator to start..."
    sleep 5
    
    # Check if validator is running
    if ! solana config get | grep -q "http://localhost:$rpc_port"; then
        echo "Error: Validator failed to start"
        exit 1
    fi
    
    echo "Validator started successfully on port $rpc_port"
}

# Main script logic
case "$1" in
    "start")
        cleanup_validator
        start_validator
        ;;
    "cleanup")
        cleanup_validator
        ;;
    *)
        echo "Usage: $0 {start|cleanup}"
        exit 1
        ;;
esac
