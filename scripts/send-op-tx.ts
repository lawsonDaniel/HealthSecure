import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({
    network: "blockdag", // Change to the defined network
    chainType: "l1", // Match the chainType from config
  });

  console.log("Sending transaction using the BlockDAG network");

  const [sender] = await ethers.getSigners();

  console.log("Sending 1 wei from", sender.address, "to itself");

  console.log("Sending L2 transaction");
  const tx = await sender.sendTransaction({
    to: sender.address,
    value: 1n,
  });

  await tx.wait();

  console.log("Transaction sent successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});