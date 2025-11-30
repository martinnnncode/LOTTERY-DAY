# LOTTERY DAY

> Privacy-preserving lottery powered by Fully Homomorphic Encryption (FHE)

## 🎯 Problem & Solution

**Problem**: Traditional lotteries expose user choices on-chain, enabling front-running and manipulation.

**Solution**: LOTTERY DAY uses FHE to keep your number choice **completely private**. The comparison happens on encrypted data - nobody can see what you picked, not even the blockchain nodes.

## 🔐 Why FHE is Essential

| Without FHE | With FHE (LOTTERY DAY) |
|-------------|------------------------|
| Choice visible on-chain | Choice encrypted end-to-end |
| Front-running possible | Impossible to front-run |
| Trust the operator | Trustless, verifiable |
| Privacy compromised | Full privacy preserved |

## 📋 Features

- **Client-side Encryption**: Numbers encrypted in browser using FHEVM SDK
- **On-chain FHE Computation**: Encrypted comparison with `FHE.eq()`
- **User-controlled Decryption**: Only you can decrypt your result via EIP-712 signature
- **Verifiable Randomness**: Per-ticket random target using block data
- **Modern UI**: Responsive design with smooth animations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOTTERY DAY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │  User    │───▶│  Frontend    │───▶│  Smart Contract     │   │
│  │  Browser │    │  (Next.js)   │    │  (FHEVM Solidity)   │   │
│  └──────────┘    └──────────────┘    └─────────────────────┘   │
│       │                │                       │                │
│       │                │                       │                │
│       ▼                ▼                       ▼                │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │ Encrypt  │    │ Relayer SDK  │    │ FHE Executor        │   │
│  │ Choice   │    │ (Decrypt)    │    │ (Encrypted Compute) │   │
│  └──────────┘    └──────────────┘    └─────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow

1. **Play**: User picks 1-10 → Encrypt in browser → Submit to contract
2. **Compare**: Contract generates random target → `FHE.eq(choice, target)` → Encrypted result
3. **Decrypt**: User signs EIP-712 → Relayer decrypts → Reveal win/lose

## 🚀 Deployed Contract

| Field | Value |
|-------|-------|
| **Network** | Ethereum Sepolia Testnet |
| **Contract** | `0x9c28E647ca220e47170b0f819228dD0AD881f546` |
| **Etherscan** | [Verified Source Code](https://sepolia.etherscan.io/address/0x9c28E647ca220e47170b0f819228dD0AD881f546#code) |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contract** | Solidity + FHEVM v0.9 (`ZamaEthereumConfig`) |
| **Frontend** | Next.js 14 + TypeScript |
| **Styling** | Tailwind CSS + Framer Motion |
| **Web3** | wagmi v2 + viem |
| **FHE SDK** | @zama-fhe/relayer-sdk v0.3.0-5 |

## 📁 Project Structure

```
lottery-day/
├── contracts/
│   └── LotteryDay.sol       # FHE lottery contract
├── test/
│   └── LotteryDay.test.ts   # Contract tests
├── scripts/
│   ├── deploy.ts            # Deployment script
│   └── verify.ts            # Etherscan verification
├── frontend/
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── config/          # Contract config & ABI
│   │   └── lib/             # FHE utilities
│   └── package.json
├── hardhat.config.ts
└── package.json
```

## 🧪 Testing

### Run Contract Tests

```bash
# Install dependencies
npm install

# Run tests (local mock mode)
npx hardhat test

# Run with coverage
npx hardhat coverage
```

### Test Cases

- ✅ Play with encrypted input
- ✅ ACL permissions set correctly
- ✅ Result handle returned
- ✅ Play count increments
- ✅ Player address stored

## 💻 Local Development

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Sepolia ETH ([Faucet](https://sepoliafaucet.com/))

### Backend (Contracts)

```bash
npm install
npm run compile
npm run deploy    # Deploy to Sepolia
npm run verify    # Verify on Etherscan
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 FHEVM Integration Details

### Contract Key Points

```solidity
// Encrypted input validation
euint8 choice = FHE.fromExternal(inputHandle, inputProof);

// Convert plaintext to encrypted
euint8 encryptedTarget = FHE.asEuint8(target);

// Encrypted comparison (no plaintext exposure)
ebool isWinnerEnc = FHE.eq(choice, encryptedTarget);

// Grant decryption permission to user
FHE.allow(isWinnerEnc, msg.sender);
```

### Sepolia FHEVM Addresses

| Contract | Address |
|----------|---------|
| FHEVM Executor | `0x92C920834Ec8941d2C77D188936E1f7A6f49c127` |
| ACL | `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D` |
| KMS Verifier | `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A` |
| Relayer URL | `https://relayer.testnet.zama.org` |

## 💼 Business Potential

### Target Markets

1. **Online Gaming** - Fair, private lottery/raffle systems
2. **NFT Drops** - Verifiable random selection without revealing choices
3. **DAO Governance** - Private voting with auditable results

### Competitive Advantage

- **First-mover**: Few FHE-based lottery solutions exist
- **Regulatory friendly**: Privacy with compliance capability
- **Scalable**: Can extend to multi-round tournaments, jackpots

### Revenue Model

- Transaction fees on plays
- Premium features (custom games, branded lotteries)
- B2B licensing for gaming platforms

## 📝 Known Issues

> **Note**: The Zama Relayer service (`https://relayer.testnet.zama.org`) may return 500 errors intermittently. This is a testnet infrastructure issue, not a code bug. The FHE logic is verified and correct - encryption, on-chain computation, and ACL permissions all function as expected.

## 📄 License

BSD-3-Clause-Clear
