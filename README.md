It seems you're looking for more specific details about the **Program Derived Address (PDA)** functionality for stores in this repository. Let me adjust the README to focus on PDAs for stores instead of custom SPL tokens in the loyalty system. I will emphasize how PDAs are used for store management.

---

## README Template (Updated for PDA Focus)

# SoDap - Solana Decentralized Shopping Platform

<div align="center">
  <img src="app/public/sodap.webp" alt="SoDap Logo" width="200" style="border-radius: 10px;">
  <h3>Decentralized E-Commerce Powered by Solana Blockchain</h3>
</div>

---

### 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Blockchain Features](#-blockchain-features)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

### 🌟 Overview

SoDap is a cutting-edge decentralized shopping platform powered by Solana blockchain. It aims to revolutionize e-commerce by providing secure, transparent, and efficient shopping experiences for users, store owners, and admins.

---

### ✨ Key Features

#### 🔐 Authentication & User Management
- Secure email/password and wallet-based logins.
- Role-based access control for enhanced security.

#### 🏪 Store Management
- Intuitive dashboard for store and inventory management.
- Real-time updates for stock and sales.

#### 🛒 Shopping Experience
- Modern interface for browsing products.
- Comprehensive cart and order tracking features.

---

### 🛡️ Blockchain Features

#### 💸 Secure Store Management Using PDAs
- **Program Derived Addresses (PDAs)**: Each store has a unique PDA that acts as a secure on-chain identifier.
- **Store-Specific Lamport Vaults**: Funds are managed in deterministic lamport vaults tied to each store's PDA.
- **On-Chain Product Management**: Immutable product details and pricing are stored securely.
- **Escrow Payment System**: PDAs handle escrow payments, ensuring buyer and seller protection.

#### 🔗 On-Chain Data
- Immutable product and store data for transparency.
- Cryptographically secure transactions to ensure trust and reliability.

---

### 🚀 Getting Started

#### Prerequisites:
- Node.js 18+ and npm/yarn.
- Solana Toolkit and wallet.
- Anchor Framework for program development.

#### Installation:
```bash
git clone https://github.com/tenrikut/sodap-mono.git
cd sodap-mono
npm install
```

#### Development:
- Use `npm run dev` for local development.
- Spin up local Solana validators using `solana-test-validator`.

---

### 🛠️ Architecture

#### Backend (Solana/Anchor)
- Each store is uniquely identified and managed via a PDA.
- Escrow accounts are tied to store PDAs for secure payments.
- Product and purchase data are stored on-chain using Rust-based Solana programs.

---

### 🛠️ Development

#### Scripts:
- `npm test` to run tests.
- `anchor deploy` for program deployment.

---

### 🤝 Contributing

1. Fork the repository.
2. Create feature branches.
3. Submit pull requests.

---

### 📄 License

This project is licensed under the MIT License.
