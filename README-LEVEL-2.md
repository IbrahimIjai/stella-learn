# s-metadao | Decentralized Crowdfunding on Stellar

**s-metadao** is a futuristic, metadata-driven crowdfunding and DAO ecosystem built on the Stellar Network using Soroban smart contracts. This project was developed as part of the **Stellar Learn Level 2** curriculum.

## 🚀 Overview
s-metadao allows users to create, discover, and fund high-impact projects using Stellar Soroban smart contracts. It features:
- **Multi-wallet Integration**: Seamless connection via `@creit-tech/stellar-wallets-kit` (Freighter, xBull, Hana, etc.).
- **Smart Contract Governance**: Fully decentralized campaign lifecycle management.
- **Real-time Feedback**: Detailed transaction tracking and status updates using `sonner` and `react-query`.
- **Custom Token Support**: Ability to fund campaigns using the platform's native Meta Token or any custom Soroban token.

## ✨ Features
- **Two-Step Campaign Creation**: A guided flow for project details and token selection.
- **Dynamic Progress Ticker**: A rolling real-time activity feed of live campaigns on the network.
- **Glassmorphic UI**: Premium dark-mode design with rich animations and responsive layouts.
- **Error Resilience**: Comprehensive handling for wallet rejections, network mismatches, and contract errors.

## 🛠 Tech Stack
- **Frontend**: React, Vite, TanStack Router, TanStack Query, Tailwind CSS, Shadcn UI.
- **Blockchain**: Soroban (Rust), Stellar SDK, Stellar Wallets Kit.
- **Toasts**: Sonner with rich color states.

## 📦 Deployment Info
- **Live Demo**: [smeta-dao.vercel.app](https://smeta-dao.vercel.app/)
- **Main Crowdfund Contract ID**: `CCURLBN3XVEEDAGANTSZLGINA2NDLMPXTNCOTLVFUI76BBWQCENMYK6Z`
- **Native Meta Token ID**: `CCELBQQHO3TMNSYOGO6CIRQML7J2SMJLTWFKISNUHIBIAESGL5KTWO76`
- **Network**: Stellar Testnet
- **Example Transaction Hash**: `df880c10257e5e01c13f6a92e665fbd7ff38...` (Minting/Creation)

## 🔧 Getting Started

### Prerequisites
- Node.js & pnpm/npm
- Stellar Freighter Wallet (configured for Testnet)

### Setup
1. Clone the repository.
2. Navigate to the `ui` directory:
   ```bash
   cd ui
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

### Smart Contracts (Optional)
If you wish to modify or redeploy the contracts:
1. Navigate to `crowdfund-contracts`.
2. Build the contracts:
   ```bash
   stellar contract build
   ```
3. Deploy:
   ```bash
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm --source deployer --network testnet
   ```

## 📸 Wallet Options
The application integrates the `StellarWalletsKit`, providing support for:
- Freighter
- xBull
- Hana
- Albedo
- Rabet

## 🛡 Error Handling
The application handles several critical error states:
1. **Wallet Not Found**: Gracefully prompts users to install or unlock their preferred wallet.
2. **User Rejection**: Detects and notifies when a transaction signature is declined.
3. **Contract Logic**: Visual feedback for invalid token addresses, insufficient balances, or failed simulations.

---
Built with 🚀 by @sundayibrahim-ijai for Stellar Learn Level 2.
