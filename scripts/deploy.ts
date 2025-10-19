
import { network } from "hardhat";


async function main() {
    const { ethers } = await network.connect({
    network: "blockdag", // Change to the defined network
    chainType: "l1", // Match the chainType from config
  });
  const HealthConsent = await ethers.getContractFactory("HealthConsent");
  const healthConsent = await HealthConsent.deploy();

  await healthConsent.waitForDeployment();

  console.log("HealthConsent deployed to:", await healthConsent.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });