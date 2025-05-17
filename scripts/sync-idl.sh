#!/bin/bash

# Create target/types directory if it doesn't exist
mkdir -p target/types

# Copy IDL JSON file and TypeScript types
cp target/idl/sodap.json target/types/
cp target/types/sodap.ts target/types/
