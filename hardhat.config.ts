// hardhat.config.ts
import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          evmVersion: "london", // Set to avoid PUSH0
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "london", // Set to avoid PUSH0
        },
      },
    },
  },
  networks: {
    blockdag: {
      type: "http",
      chainType: "l1",
      url: "https://rpc.awakening.bdagscan.com", // Loaded from .env
      chainId: 1043, // Placeholder; replace with actual BlockDAG chain ID
      accounts: ["fa83aa2c56f76fd997a409dc8fe34571fdc9c881f4d437f83aeade01b7fc3b7c"], // Loaded from .env
      gasPrice: 1000000000, // Adjust if BlockDAG requires specific gas settings
    },
  },
};

export default config;



// import type { HardhatUserConfig } from "hardhat/config";
// import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
// import { configVariable } from "hardhat/config";
// import * as dotenv from "dotenv";

// dotenv.config();

// const config: HardhatUserConfig = {
//   plugins: [hardhatToolboxMochaEthersPlugin],
//   solidity: {
//     profiles: {
//       default: {
//         version: "0.8.28",
//       },
//       production: {
//         version: "0.8.28",
//         settings: {
//           optimizer: {
//             enabled: true,
//             runs: 200,
//           },
//         },
//       },
//     },
//   },
//   networks: {
//     blockdag: {
//       type: "http",
//       chainType: "l1",
//       url: process.env.BLOCKDAG_RPC_URL || "https://rpc.awakening.bdagscan.com",
//       chainId: 1043,
//       accounts: [process.env.BLOCKDAG_PRIVATE_KEY || ""],
//       gasPrice: 1000000000,
//     },
//   },
// };

// export default config;