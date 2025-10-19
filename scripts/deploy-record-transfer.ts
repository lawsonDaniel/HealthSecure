import { network } from "hardhat";

async function main() {
  console.log("Deploying MedicalRecordTransfer contract...");
 const { ethers } = await network.connect({
    network: "blockdag", // Change to the defined network
    chainType: "l1", // Match the chainType from config
  });
  // Get the existing MedicalRecords contract address
  const medicalRecordsAddress = "0x01A8f810F50a0aE8Eb5ad9928506e77bbC93B7A4"; // Your existing MedicalRecords address
  
  // Deploy MedicalRecordTransfer
  const MedicalRecordTransfer = await ethers.getContractFactory("MedicalRecordTransfer");
  const transferContract = await MedicalRecordTransfer.deploy(medicalRecordsAddress);
  
  await transferContract.waitForDeployment();
  
  const transferAddress = await transferContract.getAddress();
  console.log("MedicalRecordTransfer deployed to:", transferAddress);
  
  // Verify contract (optional - if you have verification set up)
  console.log("Contract deployment completed!");
  console.log("MedicalRecords address:", medicalRecordsAddress);
  console.log("MedicalRecordTransfer address:", transferAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });