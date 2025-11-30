import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying LotteryDay...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  const LotteryDay = await ethers.getContractFactory("LotteryDay");
  const lottery = await LotteryDay.deploy();

  await lottery.waitForDeployment();

  const address = await lottery.getAddress();
  console.log("LotteryDay deployed to:", address);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    network: "sepolia",
    chainId: 11155111,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment.json");

  // Also save to frontend
  const frontendConfigPath = path.join(
    __dirname,
    "../frontend/src/config/contract.ts"
  );
  const frontendConfig = `// Auto-generated contract configuration
import LotteryDayArtifact from './LotteryDay.json';

export const CONTRACT_ADDRESS = "${address}" as const;
export const CHAIN_ID = 11155111;
export const NETWORK_NAME = "Sepolia";
export const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/xeMfJRSGpIGq5WiFz-bEiHoG6DGrZnAr";
export const LOTTERY_ABI = LotteryDayArtifact.abi;

export const FHEVM_CONFIG = {
  RELAYER_URL: "https://relayer.testnet.zama.org",
};
`;

  // Ensure directory exists
  const configDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(frontendConfigPath, frontendConfig);
  console.log("Frontend config updated");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

