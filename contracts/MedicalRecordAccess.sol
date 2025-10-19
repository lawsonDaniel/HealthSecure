// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMedicalRecords {
    function getRecords(address _patient) external view returns (string[] memory);
    function getKeyShare(string memory _ipfsCid) external view returns (bytes memory);
    function grantAccess(address grantee, string calldata ipfsCid, bytes calldata encryptedKeyShare) external;
}

interface IHealthConsent {
    function getConsent(address _patient) external view returns (bool, uint256, string memory);
}

contract MedicalRecordAccess {
    IMedicalRecords public medicalRecords;
    IHealthConsent public healthConsent;

    struct AccessGrant {
        address patient;
        address grantee;
        string ipfsCid;
        uint256 expiration;
        uint256 timestamp;
    }

    // Mapping to store access grants: patient => grantee => ipfsCid => AccessGrant
    mapping(address => mapping(address => mapping(string => AccessGrant))) public grants;
    // Mapping to store list of CIDs grantee has access to: grantee => patient => ipfsCids
    mapping(address => mapping(address => string[])) private granteeAccessList;

    event AccessGranted(address indexed patient, address indexed grantee, string ipfsCid, uint256 expiration);
    event AccessRevoked(address indexed patient, address indexed grantee, string ipfsCid);

    constructor(address _medicalRecordsAddress, address _healthConsentAddress) {
        require(_medicalRecordsAddress != address(0), "Invalid medical records address");
        require(_healthConsentAddress != address(0), "Invalid consent contract address");
        medicalRecords = IMedicalRecords(_medicalRecordsAddress);
        healthConsent = IHealthConsent(_healthConsentAddress);
    }

    // Grant access to a grantee for a specific IPFS CID
    function grantAccess(address grantee, string calldata ipfsCid, uint256 expiration, bytes calldata encryptedKeyShare) external {
        require(grantee != address(0), "Invalid grantee address");
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID");
        require(encryptedKeyShare.length > 0, "Invalid encrypted key share");

        (bool hasSigned, , ) = healthConsent.getConsent(msg.sender);
        require(hasSigned, "Consent not signed");

        // Verify record exists
        bool recordExists = false;
        string[] memory records = medicalRecords.getRecords(msg.sender);
        for (uint256 i = 0; i < records.length; i++) {
            if (keccak256(abi.encodePacked(records[i])) == keccak256(abi.encodePacked(ipfsCid))) {
                recordExists = true;
                break;
            }
        }
        require(recordExists, "Record not found");

        // Store the encrypted key share in MedicalRecords contract
        IMedicalRecords medicalRecordsContract = IMedicalRecords(medicalRecords);
        medicalRecordsContract.grantAccess(grantee, ipfsCid, encryptedKeyShare);

        // Store access grant
        grants[msg.sender][grantee][ipfsCid] = AccessGrant({
            patient: msg.sender,
            grantee: grantee,
            ipfsCid: ipfsCid,
            expiration: expiration,
            timestamp: block.timestamp
        });

        // Update grantee access list
        bool exists = false;
        string[] storage cids = granteeAccessList[grantee][msg.sender];
        for (uint256 i = 0; i < cids.length; i++) {
            if (keccak256(abi.encodePacked(cids[i])) == keccak256(abi.encodePacked(ipfsCid))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            granteeAccessList[grantee][msg.sender].push(ipfsCid);
        }

        emit AccessGranted(msg.sender, grantee, ipfsCid, expiration);
    }

    // Revoke access for a grantee
    function revokeAccess(address grantee, string calldata ipfsCid) external {
        require(grants[msg.sender][grantee][ipfsCid].patient == msg.sender, "No access grant found");

        delete grants[msg.sender][grantee][ipfsCid];

        // Remove CID from grantee's access list
        string[] storage cids = granteeAccessList[grantee][msg.sender];
        for (uint256 i = 0; i < cids.length; i++) {
            if (keccak256(abi.encodePacked(cids[i])) == keccak256(abi.encodePacked(ipfsCid))) {
                cids[i] = cids[cids.length - 1];
                cids.pop();
                break;
            }
        }

        emit AccessRevoked(msg.sender, grantee, ipfsCid);
    }

    // Check if grantee has access to a specific CID
    function hasAccess(address patient, address grantee, string calldata ipfsCid) external view returns (bool) {
        AccessGrant memory grant = grants[patient][grantee][ipfsCid];
        if (grant.grantee == address(0)) {
            return false;
        }
        return grant.expiration == 0 || block.timestamp < grant.expiration;
    }

    // Retrieve encrypted key share for a grantee
    function getEncryptedKeyShare(address patient, string calldata ipfsCid) external view returns (bytes memory) {
        AccessGrant memory grant = grants[patient][msg.sender][ipfsCid];
        require(grant.grantee != address(0), "No access grant found");
        require(grant.expiration == 0 || block.timestamp < grant.expiration, "Access expired");
        return medicalRecords.getKeyShare(ipfsCid);
    }

    // Get list of CIDs a grantee has access to for a specific patient
    function getGranteeAccess(address grantee, address patient) external view returns (string[] memory) {
        string[] memory cids = granteeAccessList[grantee][patient];
        if (cids.length == 0) {
            return new string[](0);
        }

        // Count valid CIDs
        uint256 validCount = 0;
        for (uint256 i = 0; i < cids.length; i++) {
            AccessGrant memory grant = grants[patient][grantee][cids[i]];
            if (grant.grantee != address(0) && (grant.expiration == 0 || block.timestamp < grant.expiration)) {
                validCount++;
            }
        }

        // Return only valid CIDs
        string[] memory validCids = new string[](validCount);
        uint256 index = 0;
        for (uint256 i = 0; i < cids.length; i++) {
            AccessGrant memory grant = grants[patient][grantee][cids[i]];
            if (grant.grantee != address(0) && (grant.expiration == 0 || block.timestamp < grant.expiration)) {
                validCids[index] = cids[i];
                index++;
            }
        }
        return validCids;
    }
}