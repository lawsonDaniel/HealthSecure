// contracts/RecordTransfer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IHealthConsent {
    function getConsent(address _patient) external view returns (bool, uint256, string memory);
}

contract RecordTransfer {
    struct Transfer {
        address from;
        address to;
        string ipfsCid;
        uint256 timestamp;
        bool revoked;
        string purpose;
    }

    struct AccessLog {
        address accessedBy;
        uint256 timestamp;
        string ipfsCid;
        string purpose;
    }

    struct AuthorizedProvider {
        address provider;
        uint256 grantedAt;
        bool isActive;
    }

    mapping(address => Transfer[]) private patientTransfers;
    mapping(address => AccessLog[]) private accessLogs;
    mapping(address => mapping(address => bool)) private authorizedProviders;
    mapping(address => address[]) private patientProviders; // Index for authorized providers
    
    IHealthConsent public healthConsent;

    event RecordTransferred(
        address indexed patient,
        address indexed provider,
        string ipfsCid,
        uint256 timestamp,
        string purpose
    );

    event AccessRevoked(
        address indexed patient,
        address indexed provider,
        string ipfsCid,
        uint256 timestamp
    );

    event AccessGranted(
        address indexed patient,
        address indexed provider,
        uint256 timestamp
    );

    event AccessLogged(
        address indexed patient,
        address indexed accessedBy,
        string ipfsCid,
        uint256 timestamp,
        string purpose
    );

    constructor(address _healthConsentAddress) {
        healthConsent = IHealthConsent(_healthConsentAddress);
    }

    modifier onlyWithConsent(address patient) {
        (bool hasConsent, , ) = healthConsent.getConsent(patient);
        require(hasConsent, "Patient has not signed consent");
        _;
    }

    function transferRecord(
        address _provider,
        string memory _ipfsCid,
        string memory _purpose
    ) public onlyWithConsent(msg.sender) returns (bool) {
        require(_provider != address(0), "Invalid provider address");
        require(_provider != msg.sender, "Cannot transfer to yourself");
        require(bytes(_ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");

        // Grant access to provider if not already granted
        if (!authorizedProviders[msg.sender][_provider]) {
            authorizedProviders[msg.sender][_provider] = true;
            patientProviders[msg.sender].push(_provider);
            emit AccessGranted(msg.sender, _provider, block.timestamp);
        }

        // Record the transfer
        patientTransfers[msg.sender].push(Transfer({
            from: msg.sender,
            to: _provider,
            ipfsCid: _ipfsCid,
            timestamp: block.timestamp,
            revoked: false,
            purpose: _purpose
        }));

        emit RecordTransferred(
            msg.sender,
            _provider,
            _ipfsCid,
            block.timestamp,
            _purpose
        );

        return true;
    }

    function revokeAccess(address _provider, string memory _ipfsCid) public returns (bool) {
        require(_provider != address(0), "Invalid provider address");
        
        // Revoke access
        authorizedProviders[msg.sender][_provider] = false;

        // Mark transfer as revoked
        for (uint i = 0; i < patientTransfers[msg.sender].length; i++) {
            if (
                patientTransfers[msg.sender][i].to == _provider &&
                keccak256(bytes(patientTransfers[msg.sender][i].ipfsCid)) == keccak256(bytes(_ipfsCid)) &&
                !patientTransfers[msg.sender][i].revoked
            ) {
                patientTransfers[msg.sender][i].revoked = true;
                break;
            }
        }

        emit AccessRevoked(msg.sender, _provider, _ipfsCid, block.timestamp);
        return true;
    }

    function revokeAllAccess(address _provider) public returns (bool) {
        require(_provider != address(0), "Invalid provider address");
        
        // Revoke all access
        authorizedProviders[msg.sender][_provider] = false;

        // Mark all transfers to this provider as revoked
        for (uint i = 0; i < patientTransfers[msg.sender].length; i++) {
            if (
                patientTransfers[msg.sender][i].to == _provider &&
                !patientTransfers[msg.sender][i].revoked
            ) {
                patientTransfers[msg.sender][i].revoked = true;
            }
        }

        emit AccessRevoked(msg.sender, _provider, "ALL_RECORDS", block.timestamp);
        return true;
    }

    function grantAccess(address _provider) public onlyWithConsent(msg.sender) returns (bool) {
        require(_provider != address(0), "Invalid provider address");
        require(_provider != msg.sender, "Cannot grant access to yourself");
        
        authorizedProviders[msg.sender][_provider] = true;
        
        // Add to providers list if not already there
        bool alreadyExists = false;
        for (uint i = 0; i < patientProviders[msg.sender].length; i++) {
            if (patientProviders[msg.sender][i] == _provider) {
                alreadyExists = true;
                break;
            }
        }
        
        if (!alreadyExists) {
            patientProviders[msg.sender].push(_provider);
        }
        
        emit AccessGranted(msg.sender, _provider, block.timestamp);
        return true;
    }

    function logAccess(
        address _patient,
        string memory _ipfsCid,
        string memory _purpose
    ) public returns (bool) {
        require(authorizedProviders[_patient][msg.sender], "Not authorized to access this patient's records");
        require(bytes(_ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");

        accessLogs[_patient].push(AccessLog({
            accessedBy: msg.sender,
            timestamp: block.timestamp,
            ipfsCid: _ipfsCid,
            purpose: _purpose
        }));

        emit AccessLogged(_patient, msg.sender, _ipfsCid, block.timestamp, _purpose);
        return true;
    }

    function getTransfers(address _patient) public view returns (Transfer[] memory) {
        require(msg.sender == _patient || authorizedProviders[_patient][msg.sender], "Not authorized");
        return patientTransfers[_patient];
    }

    function getAccessLogs(address _patient) public view returns (AccessLog[] memory) {
        require(msg.sender == _patient, "Only patient can view access logs");
        return accessLogs[_patient];
    }

    function hasAccess(address _patient, address _provider) public view returns (bool) {
        return authorizedProviders[_patient][_provider];
    }

    function getAuthorizedProviders(address _patient) public view returns (address[] memory) {
        require(msg.sender == _patient, "Only patient can view authorized providers");
        
        // Count active providers
        uint activeCount = 0;
        for (uint i = 0; i < patientProviders[_patient].length; i++) {
            if (authorizedProviders[_patient][patientProviders[_patient][i]]) {
                activeCount++;
            }
        }
        
        // Return only active providers
        address[] memory activeProviders = new address[](activeCount);
        uint currentIndex = 0;
        
        for (uint i = 0; i < patientProviders[_patient].length; i++) {
            address provider = patientProviders[_patient][i];
            if (authorizedProviders[_patient][provider]) {
                activeProviders[currentIndex] = provider;
                currentIndex++;
            }
        }
        
        return activeProviders;
    }

    function getTransferCount(address _patient) public view returns (uint) {
        require(msg.sender == _patient || authorizedProviders[_patient][msg.sender], "Not authorized");
        return patientTransfers[_patient].length;
    }
}