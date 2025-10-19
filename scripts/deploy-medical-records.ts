import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect({
    network: "blockdag", // Change to the defined network
    chainType: "l1", // Match the chainType from config
  });
  const healthConsentAddress = '0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157'; // Existing HealthConsent address
  const MedicalRecords = await ethers.getContractFactory('MedicalRecords');
  const contract = await MedicalRecords.deploy(healthConsentAddress);
  await contract.waitForDeployment();
  console.log('MedicalRecords Contract Address:', await contract.getAddress());
}

main().catch(console.error);