# s-metadao | Stellar Learn Level 3 Submission

**s-metadao** is a decentralized metadata-driven crowdfunding platform built on the Stellar Network. This repository contains the complete implementation, documentation, and tests for the Level 3 certification.

## 🚀 Overview
s-metadao goes beyond simple payments, implementing a full campaign lifecycle on-chain. Admins can create campaigns with specific funding targets using any Soroban token (defaulting to our native Meta Token). The hub provides real-time progress tracking, event synchronization, and a premium user experience.

## ✨ Level 3 Features
- **Smart Contract Core**: Implemented robust crowdfunding logic with isolation between campaigns.
- **Real-time Synchronization**: Frontend state remains in sync with on-chain data using `tanstack-query` and background polling.
- **Glassmorphism UI**: High-fidelity dark mode with ambient glow and rich feedback toasts.
- **Two-Step Creation**: Guided UX for campaign deployment.

## 📦 Deployment Info
- **Network**: Stellar Testnet
- **Crowdfund Contract**: `CCURLBN3XVEEDAGANTSZLGINA2NDLMPXTNCOTLVFUI76BBWQCENMYK6Z`
- **Native Meta Token**: `CCELBQQHO3TMNSYOGO6CIRQML7J2SMJLTWFKISNUHIBIAESGL5KTWO76`
- **Example Transaction**: `df880c10257e5e01c13f6a92e665fbd7ff38...`

## 🧪 Testing Coverage
We have implemented and verified 4 core logic tests for the crowdfunding contract:
1. `test_deposit_and_withdraw`: Verifies the full funding and withdrawal cycle.
2. `test_deposit_invalid_campaign`: Ensures error handling for non-existent hubs.
3. `test_withdraw_invalid_campaign`: Prevents unauthorized or invalid withdrawals.
4. `test_multiple_campaigns_isolation`: Validates that funds and states are strictly isolated across multiple concurrent projects.

### Test Output
![Test Output Placeholder](./ui/public/test-output.png)
*(Run `cargo test` in `crowdfund-contracts/contracts/crowdfund` to reproduce)*

## 🎥 Demo Video
Check out the 1-minute walkthrough showing campaign creation, funding, and real-time updates:
👉 [Watch Demo Video Here](https://youtu.be/w9Nok_dycAQ)

## 🔧 Installation & Setup
1. **Contracts**:
   ```bash
   cd crowdfund-contracts
   stellar contract build
   ```
2. **Frontend**:
   ```bash
   cd ui
   pnpm install
   pnpm dev
   ```

## 🛡 Performance & Caching
- **Query Caching**: Used `tanstack-query` for optimized data fetching and state management.
- **Poll Synchronization**: Implemented efficient RPC polling for transaction confirmation status.
- **Rich Feedback**: Integrated `sonner` with rich-color states for instant transaction lifecycle visibility.

---
**Submission for Stellar Learn Level 3**
@sundayibrahim-ijai
MARCH 2026
