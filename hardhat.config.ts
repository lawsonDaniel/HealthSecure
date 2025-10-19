


import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    blockdag: {
      type: "http",
      chainType: "l1",
      url: process.env.BLOCKDAG_RPC_URL || "https://rpc.awakening.bdagscan.com",
      chainId: 1043,
      accounts: [process.env.BLOCKDAG_PRIVATE_KEY || ""],
      gasPrice: 1000000000,
    },
  },
};

export default config;