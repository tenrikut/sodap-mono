# Sodap-Mono

A monorepo containing the Sodap frontend and backend components.

## Project Structure

- **sodap-front**: Frontend application built with Vite/React
- **sodap**: Backend Solana program built with Anchor/Rust

## Frontend-Backend Integration

This project uses Anchor IDL files to ensure compatibility between the frontend and the Solana program. The integration process works as follows:

### How IDL Files are Generated and Synchronized

1. When the backend Solana program is built using `anchor build`, it generates:

   - `target/idl/sodap.json` - The JSON IDL file containing program interface definitions
   - `target/types/sodap.ts` - TypeScript type definitions for the program

2. After building, a postbuild script automatically copies these files to the frontend:

   ```
   cp target/idl/sodap.json ../sodap-front/src/idl/sodap.json
   cp target/types/sodap.ts ../sodap-front/src/idl/sodap.ts
   ```

3. The frontend then imports and uses these files to interact with the Solana program.

### Setting Up the Development Environment

1. **Install dependencies:**

   ```
   # In the sodap directory (backend)
   yarn install

   # In the sodap-front directory (frontend)
   yarn install
   ```

2. **Build the Solana program:**
   ```
   # In the sodap directory
   anchor build
   ```
3. **Start a local Solana validator for development:**

   ```
   # In the sodap directory
   anchor test validator
   ```

4. **Start the frontend development server:**
   ```
   # In the sodap-front directory
   yarn dev
   ```

### Updating the Integration

Whenever you make changes to the Solana program:

1. Rebuild the program: `anchor build`
2. The postbuild script will automatically update the frontend IDL files
3. Restart the frontend development server to use the updated IDL

### Environment Configuration

Both the frontend and backend can be configured using environment variables:

#### Frontend (.env file)

```
VITE_SOLANA_NETWORK=http://localhost:8899
```

#### Backend (Anchor.toml)

```
[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
```

### Testing the Integration

1. Navigate to the test component at `/wallet-test` in the frontend
2. Connect your Phantom wallet
3. Use the test functions to verify connectivity with the Solana program
4. Check transaction signatures in the Solana explorer

## Troubleshooting

### Common Issues

1. **Version mismatches:** Ensure Anchor versions match between CLI and dependencies

   ```
   # In Anchor.toml
   anchor_version = "0.31.1"

   # In programs/sodap/Cargo.toml
   anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
   ```

2. **IDL files not updated:** Manually copy them if the postbuild script fails

   ```
   cp sodap/target/idl/sodap.json sodap-front/src/idl/sodap.json
   cp sodap/target/types/sodap.ts sodap-front/src/idl/sodap.ts
   ```

3. **Program ID mismatch:** Ensure the program ID is consistent across:

   - Backend: `sodap/Anchor.toml` and `sodap/programs/sodap/src/lib.rs`
   - Frontend: `sodap-front/src/idl/index.ts`

4. **Stack overflow in Rust program:** Add optimization settings to Cargo.toml
   ```
   [profile.release]
   opt-level = "z"
   overflow-checks = true
   lto = "fat"
   ```

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
