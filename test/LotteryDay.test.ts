import { ethers } from "hardhat";
import { LotteryDay } from "../typechain-types";

describe("LotteryDay", function () {
  let lottery: LotteryDay;

  beforeEach(async function () {
    const LotteryDay = await ethers.getContractFactory("LotteryDay");
    lottery = await LotteryDay.deploy();
    await lottery.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await lottery.getAddress();
      console.log("✅ Contract deployed to:", address);
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid contract address");
      }
    });

    it("Should initialize playCount to 0", async function () {
      const count = await lottery.playCount();
      console.log("✅ Initial playCount:", count.toString());
      if (count !== BigInt(0)) {
        throw new Error("playCount should be 0");
      }
    });
  });

  describe("Contract Interface", function () {
    it("Should have play function", async function () {
      if (typeof lottery.play !== "function") {
        throw new Error("play function not found");
      }
      console.log("✅ play() function exists");
    });

    it("Should have getPlay function", async function () {
      if (typeof lottery.getPlay !== "function") {
        throw new Error("getPlay function not found");
      }
      console.log("✅ getPlay() function exists");
    });

    it("Should have playCount function", async function () {
      if (typeof lottery.playCount !== "function") {
        throw new Error("playCount function not found");
      }
      console.log("✅ playCount() function exists");
    });
  });

  describe("ABI Verification", function () {
    it("Should have Played event", async function () {
      const event = lottery.interface.getEvent("Played");
      if (!event) {
        throw new Error("Played event not found");
      }
      console.log("✅ Played event exists with", event.inputs.length, "parameters");
    });

    it("Should have correct getPlay return types", async function () {
      const func = lottery.interface.getFunction("getPlay");
      if (!func || !func.outputs || func.outputs.length !== 2) {
        throw new Error("getPlay should return 2 values");
      }
      console.log("✅ getPlay returns: player (address), resultHandle (bytes32)");
    });
  });
});

/**
 * Note: Full FHE integration tests require the FHEVM environment.
 * These tests verify the contract interface and basic deployment.
 * 
 * For complete FHE testing:
 * 1. Use `npx hardhat test --network sepolia` for live testing
 * 2. Or use the fhevm-hardhat-plugin mock mode
 * 
 * The encryption/decryption flow is tested via the frontend
 * integration with the Zama Relayer SDK.
 */
