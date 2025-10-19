// contracts/HealthConsent.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HealthConsent {
    struct Consent {
        bool signed;
        uint256 timestamp;
        string consentHash;
    }

    mapping(address => Consent) private consents;

    event ConsentSigned(address indexed patient, uint256 timestamp, string consentHash);

    function signConsent(address _patient, string memory _consentHash) public returns (bool) {
        require(msg.sender == _patient, "Only the patient can sign their own consent");
        require(!consents[_patient].signed, "Consent already signed");

        consents[_patient] = Consent({
            signed: true,
            timestamp: block.timestamp,
            consentHash: _consentHash
        });

        emit ConsentSigned(_patient, block.timestamp, _consentHash);
        return true;
    }

    function getConsent(address _patient) public view returns (bool, uint256, string memory) {
        Consent memory consent = consents[_patient];
        return (consent.signed, consent.timestamp, consent.consentHash);
    }

    
}