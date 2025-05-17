#!/bin/bash
# Script to run a single test file to avoid loading files with syntax errors

# Build the program first
anchor build

# Run the specific test file directly with ts-mocha
npx ts-mocha -p ./tsconfig.test.json -t 1000000 "$1"
