#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SODAP_ROOT="$DIR/.."
FRONTEND_IDL_DIR="$SODAP_ROOT/app/src/idl"

# Ensure the target directory exists
mkdir -p "$FRONTEND_IDL_DIR"

# Copy IDL files
echo "Syncing IDL files to frontend..."
cp "$SODAP_ROOT/target/idl/sodap.json" "$FRONTEND_IDL_DIR/sodap.json"
cp "$SODAP_ROOT/target/types/sodap.ts" "$FRONTEND_IDL_DIR/sodap.ts"

echo "IDL files synced successfully!"
