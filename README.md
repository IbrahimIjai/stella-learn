# s-metadao | Stellar Learn Level 4 (Production Readiness)

![Build Status](https://github.com/ibrahimijai/stella-learn/actions/workflows/ci.yml/badge.svg)
[![Stellar Network](https://img.shields.io/badge/Network-Stellar%20Testnet-08B5E5?style=flat&logo=stellar)](https://stellar.org)
[![Platform](https://img.shields.io/badge/Platform-Vercel-black?style=flat&logo=vercel)](https://smeta-dao.vercel.app/)

**s-metadao** is a production-hardened, metadata-driven crowdfunding platform. This Level 4 submission focuses on advanced contract patterns, inter-contract communication, and enterprise-grade CI/CD pipelines.

## 🚀 Level 4 Advanced Features
- **Inter-Contract Communication**: The Crowdfund engine core implements advanced patterns by orchestrating calls to the Stellar Token contracts (minting/transferring) during the funding lifecycle.
- **Production CI/CD**: Fully automated pipeline via GitHub Actions that validates both the Soroban contract logic and the React frontend on every push.
- **Advanced Event Streaming**: Real-time optimistic UI updates combined with RPC polling for robust state synchronization.
- **Full Production Responsiveness**: Optimized mobile experience with custom-built glassmorphic components that scale from small handsets to 4K displays.

## 📦 Deployment & Production Info
- **Live Production URL**: [smeta-dao.vercel.app](https://smeta-dao.vercel.app/)
- **Network**: Stellar Testnet
- **Crowdfund Master Contract**: `CCURLBN3XVEEDAGANTSZLGINA2NDLMPXTNCOTLVFUI76BBWQCENMYK6Z`
- **Custom Native Token**: `CCELBQQHO3TMNSYOGO6CIRQML7J2SMJLTWFKISNUHIBIAESGL5KTWO76` (MetaToken)
- **Verified Inter-Contract Tx**: `bd4b3b7d51ffd8e9b3ab9d8b4c19d12ffaf284873b72b15eb024ae3925017f51`

## 🔄 Inter-Contract Calls
The `deposit` and `withdraw` functions in our Crowdfund contract utilize the Soroban Token Interface to interact with external tokens (MetaToken):
```rust
// Inter-contract call example in deposit():
let client = soroban_sdk::token::Client::new(&env, &campaign.token);
client.transfer(&user, &env.current_contract_address(), &amount);
```

## 🧪 CI/CD Pipeline
Our GitHub Actions workflow ensures production quality by running Rust tests and verifying the React production build before deployment.

### Pipeline Status
![CI/CD Pipeline Success Status](./level-2-4/ui/public/screenshots/cicd-status.png)

## 📱 Mobile Experience
- **Fluid Layouts**: Tailwind-powered responsive design.
- **Touch-Optimized**: Custom wallet interaction flows designed for mobile browsers.
- **Ambient Glow**: Performance-optimized CSS blurs that look stunning on retina displays.

### Mobile View Screenshot
![Mobile View Screenshot](./level-2-4/ui/public/screenshots/mobile-view.png)

---
**Advanced Submission for Stellar Learn Level 4**
[ibrahimijai](https://github.com/ibrahimijai)
MARCH 2026
