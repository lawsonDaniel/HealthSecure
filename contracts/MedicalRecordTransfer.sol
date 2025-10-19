// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMedicalRecords {
    function getRecords(address _patient) external view returns (string[] memory);
}

contract MedicalRecordTransfer {
    IMedicalRecords public medicalRecords;
    
    struct TransferRequest {
        address fromPatient;
        address toRecipient;
        string[] ipfsCids;
        uint256 timestamp;
        bool completed;
        bool approved;
        string purpose;
        uint256 expiry;
    }
    
    mapping(bytes32 => TransferRequest) public transferRequests;
    mapping(address => bytes32[]) public patientTransfers;
    mapping(address => bytes32[]) public recipientTransfers;
    
    event TransferRequested(
        bytes32 indexed requestId,
        address indexed fromPatient,
        address indexed toRecipient,
        string[] ipfsCids,
        uint256 timestamp,
        string purpose,
        uint256 expiry
    );
    
    event TransferApproved(
        bytes32 indexed requestId,
        address indexed fromPatient,
        address indexed toRecipient,
        uint256 approvedAt
    );
    
    event TransferCompleted(
        bytes32 indexed requestId,
        address indexed fromPatient,
        address indexed toRecipient,
        uint256 completedAt
    );
    
    event TransferRejected(
        bytes32 indexed requestId,
        address indexed fromPatient,
        address indexed toRecipient,
        uint256 rejectedAt
    );

    constructor(address _medicalRecordsAddress) {
        require(_medicalRecordsAddress != address(0), "Invalid medical records address");
        medicalRecords = IMedicalRecords(_medicalRecordsAddress);
    }
    
    function requestTransfer(
        address _toRecipient,
        string[] memory _ipfsCids,
        string memory _purpose,
        uint256 _durationInHours
    ) external returns (bytes32) {
        require(_toRecipient != address(0), "Invalid recipient address");
        require(_toRecipient != msg.sender, "Cannot transfer to yourself");
        require(_ipfsCids.length > 0, "No records specified");
        require(_durationInHours > 0 && _durationInHours <= 720, "Duration must be between 1 and 720 hours");
        
        // Verify the patient owns these records
        string[] memory patientRecords = medicalRecords.getRecords(msg.sender);
        for (uint i = 0; i < _ipfsCids.length; i++) {
            bool recordExists = false;
            for (uint j = 0; j < patientRecords.length; j++) {
                if (keccak256(bytes(_ipfsCids[i])) == keccak256(bytes(patientRecords[j]))) {
                    recordExists = true;
                    break;
                }
            }
            require(recordExists, "Patient does not own one or more specified records");
        }
        
        bytes32 requestId = keccak256(abi.encode(
            msg.sender,
            _toRecipient,
            block.timestamp,
            _ipfsCids
        ));
        
        uint256 expiry = block.timestamp + (_durationInHours * 1 hours);
        
        transferRequests[requestId] = TransferRequest({
            fromPatient: msg.sender,
            toRecipient: _toRecipient,
            ipfsCids: _ipfsCids,
            timestamp: block.timestamp,
            completed: false,
            approved: false,
            purpose: _purpose,
            expiry: expiry
        });
        
        patientTransfers[msg.sender].push(requestId);
        recipientTransfers[_toRecipient].push(requestId);
        
        emit TransferRequested(
            requestId,
            msg.sender,
            _toRecipient,
            _ipfsCids,
            block.timestamp,
            _purpose,
            expiry
        );
        
        return requestId;
    }
    
    function approveTransfer(bytes32 _requestId) external {
        TransferRequest storage request = transferRequests[_requestId];
        require(request.fromPatient == msg.sender, "Only patient can approve transfer");
        require(!request.approved, "Transfer already approved");
        require(block.timestamp <= request.expiry, "Transfer request expired");
        
        request.approved = true;
        
        emit TransferApproved(_requestId, request.fromPatient, request.toRecipient, block.timestamp);
    }
    
    function completeTransfer(bytes32 _requestId) external {
        TransferRequest storage request = transferRequests[_requestId];
        require(request.toRecipient == msg.sender, "Only recipient can complete transfer");
        require(request.approved, "Transfer not approved by patient");
        require(!request.completed, "Transfer already completed");
        require(block.timestamp <= request.expiry, "Transfer request expired");
        
        request.completed = true;
        
        emit TransferCompleted(_requestId, request.fromPatient, request.toRecipient, block.timestamp);
    }
    
    function rejectTransfer(bytes32 _requestId) external {
        TransferRequest storage request = transferRequests[_requestId];
        require(request.fromPatient == msg.sender, "Only patient can reject transfer");
        require(!request.completed, "Transfer already completed");
        
        // Mark as completed to prevent further actions
        request.completed = true;
        
        emit TransferRejected(_requestId, request.fromPatient, request.toRecipient, block.timestamp);
    }
    
    function getTransferRequest(bytes32 _requestId) external view returns (
        address fromPatient,
        address toRecipient,
        string[] memory ipfsCids,
        uint256 timestamp,
        bool completed,
        bool approved,
        string memory purpose,
        uint256 expiry
    ) {
        TransferRequest memory request = transferRequests[_requestId];
        return (
            request.fromPatient,
            request.toRecipient,
            request.ipfsCids,
            request.timestamp,
            request.completed,
            request.approved,
            request.purpose,
            request.expiry
        );
    }
    
    function getPatientTransfers(address _patient) external view returns (bytes32[] memory) {
        return patientTransfers[_patient];
    }
    
    function getRecipientTransfers(address _recipient) external view returns (bytes32[] memory) {
        return recipientTransfers[_recipient];
    }
    
    function getPatientRecords(address _patient) external view returns (string[] memory) {
        return medicalRecords.getRecords(_patient);
    }
}