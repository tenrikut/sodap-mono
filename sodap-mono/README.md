# SoDap - Solana Decentralized Shopping Platform

<div align="center">
  <img src="app/public/sodap.webp" alt="SoDap Logo" width="200" style="border-radius: 10px;">
  <h3>Decentralized E-Commerce Powered by Solana Blockchain</h3>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-v1.18-8256ff)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Anchor-v0.31.0-41c2c4)](https://www.anchor-lang.com/)
[![Vite](https://img.shields.io/badge/Vite-v5.4-646CFF)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-v18.3-61DAFB)](https://reactjs.org/)

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Blockchain Features](#-blockchain-features)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [Data Models](#-data-models)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

SoDap is a decentralized shopping platform that leverages Solana blockchain technology to provide secure, transparent, and efficient e-commerce experiences. The platform connects store owners directly with customers, eliminating intermediaries while ensuring transaction security through blockchain technology.

Built with Next.js for the frontend and Solana/Anchor for the blockchain infrastructure, SoDap offers a modern web experience with the benefits of decentralized finance.

## ✨ Key Features

### 🔐 Authentication & User Management

- **Multi-user System**: Separate roles for customers, store owners, and platform admins
- **Secure Authentication**: Email/password and wallet-based authentication
- **Role-based Access Control**: Protected routes and permission-based actions

### 🏪 Store Management

- **Intuitive Dashboard**: Easy-to-use interface for store owners to manage products
- **Real-time Inventory**: Live tracking of product stock and sales
- **Product Catalog**: Rich product information with customizable attributes
- **QR Code Generation**: Generate QR codes for physical products and checkout

### 🛒 Shopping Experience

- **Modern Marketplace UI**: Browse products across multiple stores
- **Cart Management**: Add, remove, and modify items in your shopping cart
- **Search & Filters**: Find products by category, price range, and more
- **Order History**: Track all past purchases and delivery status

## ⛓️ Blockchain Features

### 💸 Solana Pay Integration

- **Web3 Payments**: One-tap checkout with Phantom and other Solana wallets
- **QR Code Payments**: Mobile payments via QR code scanning
- **Transaction Verification**: Real-time confirmation of payment success

### 💰 Escrow Payment System

- **Secure Funds**: Two-step escrow payment process for buyer protection
- **Store-specific PDAs**: Deterministic lamport vaults for each store
- **Release/Refund Mechanisms**: Controlled fund release and refund options

### 🎁 Loyalty Token System

- **Store-specific Tokens**: Custom SPL tokens for each store's loyalty program
- **Automatic Rewards**: Earn points automatically with every purchase
- **Redemption System**: Exchange loyalty points for discounts or SOL
- **Token-2022 Ready**: Architecture prepared for Token-2022 extensions

### 🔄 On-chain Product Management

- **Decentralized Inventory**: Product data stored on the Solana blockchain
- **Transparent Pricing**: Immutable product pricing and details
- **Secure Transactions**: Cryptographically verified purchases

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- [Solana Tool Suite](https://docs.solanalabs.com/cli/install) (for blockchain interaction)
- [Phantom Wallet](https://phantom.app/) or another Solana wallet
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) (for development)

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sodap.git
cd sodap

# Install dependencies for the Solana program
yarn install

# Install dependencies for the frontend app
cd app
yarn install
cd ..

# Set up environment variables for the frontend
cp app/.env.example app/.env
# Edit app/.env with your configuration

# Set up Solana development environment
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --url devnet

# Build and deploy the Solana program
yarn build     # builds the Solana program and syncs IDL to frontend
yarn deploy    # deploys to the configured Solana cluster

# Start the development servers
yarn dev       # starts the Solana localnet
yarn app:dev   # starts the frontend development server
```

### Environment Variables

Create an `.env` file in the app directory with the following variables:

```bash
# Solana
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SODAP_PROGRAM_ID=4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv
```

## 📱 Usage

### For Shoppers

1. **Create an Account**: Sign up with email or connect your Solana wallet
2. **Browse the Marketplace**: Explore products from various stores
3. **Add to Cart**: Select items and add them to your shopping cart
4. **Checkout with Solana Pay**:
   - Connect your Phantom wallet
   - Confirm the transaction
   - Receive order confirmation

### For Store Owners

1. **Register a Store**: Create your store profile with details and branding
2. **Add Products**: Create product listings with details, prices, and inventory
3. **Manage Orders**: Process incoming orders and track fulfillment
4. **Setup Loyalty Program**: Configure your store's loyalty token rewards
5. **Withdraw Funds**: Release funds from your store's escrow account

### Demo Accounts

For testing purposes, you can use these demo accounts:

- **Customer**:

  - Username: `sodap`
  - Password: `sodap`

- **Test User with Wallet**:
  - Username: `tamkin`
  - Password: `test1234`
  - Wallet: `9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J`

## 🏗️ Architecture

SoDap follows a modern architecture combining a Next.js frontend with Solana blockchain backend:

### Frontend (Next.js)

```
app/
├── components/     # UI components
│   ├── cart/       # Shopping cart components
│   ├── store/      # Store management components
│   └── ...         # Other UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── public/         # Static assets
└── utils/          # Utility functions
```

- **Framework**: Next.js 15.3 with App Router
- **UI**: Combination of Chakra UI and TailwindCSS
- **State Management**: React Context API
- **Authentication**: NextAuth.js with wallet integration

### Backend (Solana/Anchor)

```
programs/
└── sodap/
    ├── src/
    │   ├── lib.rs           # Main program entry
    │   ├── instructions/    # Program instructions
    │   ├── state/           # Program state definitions
    │   └── error.rs         # Custom error types
    └── Cargo.toml           # Program dependencies
```

- **Framework**: Anchor 0.31.0
- **Program ID**: `4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv`
- **Account System**: PDAs (Program Derived Addresses)
- **Token Support**: SPL Tokens and Token-2022 support

### Key Integration Points

1. **Wallet Connection**: Frontend connects to Phantom wallet
2. **Transaction Signing**: User-signed transactions for purchases
3. **Account Reading**: Reading on-chain store and product data
4. **Event Handling**: Processing transaction events for UI updates

### Transaction Flows

#### Purchase Flow

The following diagram illustrates the purchase flow in SoDap, showing how customers interact with stores and the Solana blockchain:

<div align="center">
  <img src="public/Purchase flow.png" alt="SoDap Purchase Flow Diagram" width="800">
</div>

#### Refund Flow

The following diagram illustrates the refund process in SoDap, showing how store managers process refund requests:

<div align="center">
  <img src="public/Refund flow.png" alt="SoDap Refund Flow Diagram" width="800">
</div>

## 📊 Data Models

### Store

```rust
#[account]
pub struct Store {
    pub owner: Pubkey,         // Store owner's wallet address
    pub name: String,          // Store name
    pub description: String,   // Store description
    pub logo_uri: String,      // Store logo URI
    pub is_active: bool,       // Store active status
    pub revenue: u64,          // Total store revenue in lamports
}
```

### Product

```rust
#[account]
pub struct Product {
    pub product_uuid: [u8; 16],     // Unique identifier
    pub store_id: Pubkey,           // Store that owns this product
    pub price: u64,                 // Price in lamports (SOL)
    pub stock: u64,                 // Current inventory level
    pub metadata_uri: String,       // Off-chain data URI
    pub created_at: i64,            // Creation timestamp
    pub deactivated: bool,          // Product active status
}
```

### Purchase

```rust
#[account]
pub struct Purchase {
    pub product_ids: Vec<Pubkey>,   // Products purchased
    pub quantities: Vec<u64>,       // Quantities of each product
    pub total_paid: u64,            // Total amount paid
    pub gas_fee: u64,               // Transaction fee
    pub store: Pubkey,              // Store where purchase was made
    pub buyer: Pubkey,              // Buyer's wallet address
    pub timestamp: i64,             // Purchase timestamp
}
```

### Loyalty

```rust
#[account]
pub struct LoyaltyMint {
    pub store: Pubkey,              // Store this loyalty program belongs to
    pub mint: Pubkey,               // Token mint address
    pub authority: Pubkey,          // Mint authority
    pub points_per_sol: u64,        // Reward rate
    pub redemption_rate: u64,       // Points required for rewards
    pub total_points_issued: u64,   // Total points issued
    pub total_points_redeemed: u64, // Total points redeemed
    pub is_token2022: bool,         // Token standard flag
}
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Build Solana program
anchor build

# Test Solana program
anchor test

# Deploy Solana program
anchor deploy
```

### Testing Locally

1. Start a local Solana validator:

   ```bash
   solana-test-validator
   ```

2. Deploy the program locally:

   ```bash
   anchor build
   anchor deploy --provider.cluster localnet
   ```

3. Update the program ID in `.env.local` and `Anchor.toml`

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

## 🧩 Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the SoDap team</p>
  <p>
    <a href="https://github.com/yourusername/sodap-app">GitHub</a> •
    <a href="https://discord.gg/yourdiscord">Discord</a> •
    <a href="https://twitter.com/sodap">Twitter</a>
  </p>
</div>
