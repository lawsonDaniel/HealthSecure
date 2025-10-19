// scripts/grantAccess.ts
import { network } from "hardhat";


async function main() {
  const MEDICAL_RECORD_ACCESS_ADDRESS = "0x7840950A6B8ae1C7209F9907A8829FB063892ba6";
  const patient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const grantee = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const expiration = Math.floor(Date.now() / 1000) + 604800; // 7 days
 const { ethers } = await network.connect({
    network: "blockdag", // Change to the defined network
    chainType: "l1", // Match the chainType from config
  });
  const MedicalRecordAccess = await ethers.getContractFactory("MedicalRecordAccess");
  const contract = MedicalRecordAccess.attach(MEDICAL_RECORD_ACCESS_ADDRESS);
  const signer = await ethers.getSigner(patient);

  const tx = await contract.connect(signer).grantAccess(grantee, cid, expiration);
  await tx.wait();
  console.log("Access granted:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});