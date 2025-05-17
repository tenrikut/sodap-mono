#!/bin/bash

# Standard Solana ports
RPC_PORT=8899
WS_PORT=8900
FAUCET_PORT=9900

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
        ((port++))
    done
    return 1
}

# Check if validator is already running
check_validator() {
    if pgrep -f "solana-test-validator" > /dev/null; then
        return 0    # Validator is running
    else
        return 1    # Validator is not running
    fi
}

start_validator() {
    echo "Starting validator..."
    
    # Try to use standard ports first, fall back to finding free ports if needed
    local rpc_port=$RPC_PORT
    local ws_port=$WS_PORT
    local faucet_port=$FAUCET_PORT
    
    if check_port $rpc_port; then
        rpc_port=$(find_free_port 8899)
    fi
    
    if check_port $ws_port; then
        ws_port=$(find_free_port 8900)
    fi
    
    if check_port $faucet_port; then
        faucet_port=$(find_free_port 9900)
    fi
    
    echo "Using RPC port: $rpc_port"
    echo "Using WS port: $ws_port"
    echo "Using Faucet port: $faucet_port"
    
    # Clean up any existing validator
    cleanup_validator
    
    # Start the validator with proper ports
    solana-test-validator \
        --reset \
        --rpc-port $rpc_port \
        --ws-port $ws_port \
        --faucet-port $faucet_port \
        --ledger test-ledger \
        --quiet \
        > validator.log 2>&1 &
    
    # Wait for validator to start
    sleep 5
    
    # Configure solana CLI to use the correct RPC URL
    solana config set --url http://localhost:$rpc_port
    
    if ! check_validator; then
        echo "Failed to start validator"
        return 1
    fi
    
    echo "Validator started successfully"
    return 0
}

cleanup_validator() {
    if check_validator; then
        echo "Stopping validator..."
        pkill -f "solana-test-validator"
        sleep 1
    fi
}

case "$1" in
    start)
        start_validator
        ;;
    test)
        start_validator
        ;;
    cleanup)
        cleanup_validator
        ;;
    *)
        echo "Usage: $0 {start|test|cleanup}"
        exit 1
esac
