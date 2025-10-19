// scripts/deployMedicalRecordAccess.ts
import { network } from "hardhat";

async function main() {
  const MEDICAL_RECORDS_ADDRESS = "0x01A8f810F50a0aE8Eb5ad9928506e77bbC93B7A4";
  const HEALTH_CONSENT_ADDRESS = "0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157";
const { ethers } = await network.connect({
    network: "blockdag", // Change to the defined network
    chainType: "l1", // Match the chainType from config
  });
  const MedicalRecordAccess = await ethers.getContractFactory("MedicalRecordAccess");
  const contract = await MedicalRecordAccess.deploy(MEDICAL_RECORDS_ADDRESS, HEALTH_CONSENT_ADDRESS);

  await contract.waitForDeployment();

  console.log("MedicalRecordAccess deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});