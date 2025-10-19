// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ConsentManager {
    struct Consent {
        bool hasSigned;
        uint256 timestamp;
        string consentHash;
        string ipfsCid; // Added for IPFS storage
    }

    // Map patient address to array of consents for history
    mapping(address => Consent[]) private consents;

    event ConsentSigned(
        address indexed patient,
        uint256 timestamp,
        string consentHash,
        string ipfsCid
    );

    function signConsent(address _patient, string memory _consentHash, string memory _ipfsCid) external returns (bool) {
        require(_patient != address(0), "Invalid patient address");
        require(bytes(_consentHash).length > 0, "Invalid consent hash");
        require(msg.sender == _patient, "Only patient can sign consent");

        Consent memory newConsent = Consent({
            hasSigned: true,
            timestamp: block.timestamp,
            consentHash: _consentHash,
            ipfsCid: _ipfsCid
        });

        consents[_patient].push(newConsent);
        emit ConsentSigned(_patient, block.timestamp, _consentHash, _ipfsCid);
        return true;
    }

    function getConsent(address _patient) external view returns (Consent[] memory) {
        return consents[_patient];
    }

    function hasSignedConsent(address _patient) external view returns (bool) {
        return consents[_patient].length > 0;
    }
}