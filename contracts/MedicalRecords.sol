// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IHealthConsent {
    function getConsent(address _patient) external view returns (bool, uint256, string memory);
}

contract MedicalRecords {
    IHealthConsent public healthConsent;

    // Event emitted when a record is uploaded with IPFS CID
    event RecordUploaded(address indexed patient, uint256 timestamp, string ipfsCid);

    // Event emitted when access is granted
    event AccessGranted(address indexed patient, address indexed authorized, string ipfsCid);

    // Mapping to store IPFS CIDs of uploaded records
    mapping(address => string[]) private patientRecords;

    // Mapping for encrypted key shares: patient => ipfsCid => authorized => encryptedKeyShare
    // (authorized can be the patient themselves for self-access)
    mapping(address => mapping(string => mapping(address => bytes))) private keyShares;

    // Mapping to track ownership: ipfsCid => patient (for quick lookup in getKeyShare)
    mapping(string => address) private cidToPatient;

    constructor(address _healthConsentAddress) {
        require(_healthConsentAddress != address(0), "Invalid consent contract address");
        healthConsent = IHealthConsent(_healthConsentAddress);
    }

    // Upload IPFS CID for a medical record, including patient's self-encrypted key share
    function uploadRecord(string memory _ipfsCid, bytes memory _selfEncryptedKeyShare) public returns (bool) {
        address _patient = msg.sender;  // Assume caller is the patient
        (bool hasSigned, , ) = healthConsent.getConsent(_patient);
        require(hasSigned, "Consent not signed");
        require(bytes(_ipfsCid).length > 0, "Invalid IPFS CID");
        require(_selfEncryptedKeyShare.length > 0, "Must provide self-encrypted key share");

        patientRecords[_patient].push(_ipfsCid);
        cidToPatient[_ipfsCid] = _patient;
        keyShares[_patient][_ipfsCid][_patient] = _selfEncryptedKeyShare;  // Store patient's own key share

        emit RecordUploaded(_patient, block.timestamp, _ipfsCid);
        return true;
    }

    // Grant access to an authorized address (e.g., doctor) for a specific CID
    function grantAccess(address _authorized, string memory _ipfsCid, bytes memory _encryptedKeyShare) public {
        address _patient = msg.sender;  // Caller must be patient
        require(cidToPatient[_ipfsCid] == _patient, "Only patient can grant access");
        require(_authorized != address(0), "Invalid authorized address");
        require(_encryptedKeyShare.length > 0, "Invalid encrypted key share");

        keyShares[_patient][_ipfsCid][_authorized] = _encryptedKeyShare;
        emit AccessGranted(_patient, _authorized, _ipfsCid);
    }

    // Retrieve the caller's encrypted key share for a CID (if authorized or owner)
    function getKeyShare(string memory _ipfsCid) public view returns (bytes memory) {
        address _patient = cidToPatient[_ipfsCid];
        require(_patient != address(0), "Invalid CID");
        bytes memory share = keyShares[_patient][_ipfsCid][msg.sender];
        require(share.length > 0, "No access to this record");
        return share;
    }

    // Retrieve patient's uploaded record CIDs
    function getRecords(address _patient) public view returns (string[] memory) {
        return patientRecords[_patient];
    }
}