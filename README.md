# LOTTERY DAY

> Privacy-preserving lottery powered by Fully Homomorphic Encryption (FHE)

## Problem & Solution

**Problem**: Traditional lotteries expose user choices on-chain, enabling front-running and manipulation.

**Solution**: LOTTERY DAY uses FHE to keep your number choice **completely private**. Both user choice AND random target are encrypted — comparison happens entirely on encrypted data.

| Without FHE | With FHE (LOTTERY DAY) |
|-------------|------------------------|
| Choice visible on-chain | Choice encrypted end-to-end |
| Front-running possible | Impossible to front-run |
| Trust the operator | Trustless, verifiable |

## Features

- **Client-side Encryption**: Numbers encrypted in browser using FHEVM SDK
- **On-chain FHE Computation**: Encrypted comparison with `FHE.eq()`
- **Verifiable Randomness**: On-chain random target generation
- **User-controlled Decryption**: Only you can decrypt via EIP-712 signature

## How It Works

1. **Play**: Pick 1-10 → Encrypt in browser → Submit to contract
2. **Compare**: Contract generates encrypted random target → `FHE.eq(choice, target)`
3. **Decrypt**: Sign EIP-712 → Relayer decrypts → Reveal win/lose

## Deployed Contract

| Field | Value |
|-------|-------|
| **Network** | Ethereum Sepolia |
| **Contract** | `0xD7d805fCeb306A096793106D6AfB829c7bf1fE41` |
| **Etherscan** | [Verified Source](https://sepolia.etherscan.io/address/0xD7d805fCeb306A096793106D6AfB829c7bf1fE41#code) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Solidity + FHEVM v0.9 |
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Web3 | wagmi v2 + viem |
| FHE SDK | @zama-fhe/relayer-sdk v0.3.0-5 |

## Quick Start

```bash
# Backend
npm install
npx hardhat test
npx hardhat run scripts/deploy.ts --network sepolia

# Frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tests

```bash
npx hardhat test
```

- ✅ Contract deployment
- ✅ Play function with encrypted input
- ✅ ACL permissions
- ✅ Event emission

## Core FHE Logic

```solidity
// Encrypted user choice
euint8 choice = FHE.fromExternal(inputHandle, inputProof);

// Random target using on-chain randomness
uint8 target = uint8(keccak256(...) % 10 + 1);
euint8 encryptedTarget = FHE.asEuint8(target);

// Encrypted comparison - user choice remains private
ebool isWinnerEnc = FHE.eq(choice, encryptedTarget);

// Grant decryption permission
FHE.allow(isWinnerEnc, msg.sender);
```

## Business Potential

Privacy-preserving gaming infrastructure for online lotteries, NFT drops, and DAO governance. First-mover advantage in FHE-based gaming with B2B licensing potential.

## License

BSD-3-Clause-Clear
