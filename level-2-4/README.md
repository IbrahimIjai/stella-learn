# s-metadao | Stellar Learn Level 4 (Production Readiness)

![Build Status](https://github.com/@sundayibrahim-ijai/s-metadao/actions/workflows/ci.yml/badge.svg)

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

## 🔄 Inter-Contract Calls
The `deposit` and `withdraw` functions in our Crowdfund contract utilize the Soroban Token Interface to interact with external tokens:
```rust
// Inter-contract call example in deposit():
let client = soroban_sdk::token::Client::new(&env, &campaign.token);
client.transfer(&user, &env.current_contract_address(), &amount);
```

## 🧪 CI/CD Pipeline
Our GitHub Actions workflow (`.github/workflows/ci.yml`) ensures production quality:
- **Contract Integrity**: Runs Rust test suites on every pull request.
- **Frontend Validation**: Verifies production builds and linting before deployment.
- **WASM Verification**: Ensures contracts build correctly for the `wasm32-unknown-unknown` target.

### Pipeline Status
![CI/CD Workflow Placeholder](./ui/public/cicd-status.png)

## 📱 Mobile Experience
- **Fluid Layouts**: Tailwind-powered responsive design.
- **Touch-Optimized**: Custom wallet interaction flows designed for mobile browsers.
- **Ambient Glow**: Performance-optimized CSS blurs that look stunning on retina displays without draining battery.

### Mobile View Screenshot
![Mobile View Placeholder](./ui/public/mobile-view.png)

---
**Advanced Submission for Stellar Learn Level 4**
@sundayibrahim-ijai
MARCH 2026
