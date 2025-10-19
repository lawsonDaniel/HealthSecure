'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Send, CheckCircle, AlertCircle, Eye, RefreshCw, X } from 'lucide-react';
import { ethers } from 'ethers';

// Contract addresses
const MEDICAL_RECORDS_ADDRESS = ethers.getAddress('0x96081A4b38AcBbc4dAAbc72178AF8C2818DC9652');
const HEALTH_CONSENT_ADDRESS = ethers.getAddress('0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157');
const MEDICAL_RECORD_ACCESS_ADDRESS = ethers.getAddress('0xC379206a95B6bb841ac97F4ff15927218465694C');

// Contract ABIs
const MEDICAL_RECORDS_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_healthConsentAddress",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "patient",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "authorized",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string",
        name: "ipfsCid",
        type: "string"
      }
    ],
    name: "AccessGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "patient",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "ipfsCid",
        type: "string"
      }
    ],
    name: "RecordUploaded",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_ipfsCid",
        type: "string"
      }
    ],
    name: "getKeyShare",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_patient",
        type: "address"
      }
    ],
    name: "getRecords",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_authorized",
        type: "address"
      },
      {
        internalType: "string",
        name: "_ipfsCid",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_encryptedKeyShare",
        type: "bytes"
      }
    ],
    name: "grantAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "healthConsent",
    outputs: [
      {
        internalType: "contract IHealthConsent",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_ipfsCid",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_selfEncryptedKeyShare",
        type: "bytes"
      }
    ],
    name: "uploadRecord",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const HEALTH_CONSENT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_patient",
        type: "address"
      }
    ],
    name: "getConsent",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

const MEDICAL_RECORD_ACCESS_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_medicalRecordsAddress', type: 'address' },
      { internalType: 'address', name: '_healthConsentAddress', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
      { indexed: true, internalType: 'address', name: 'grantee', type: 'address' },
      { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'expiration', type: 'uint256' }
    ],
    name: 'AccessGranted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
      { indexed: true, internalType: 'address', name: 'grantee', type: 'address' },
      { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' }
    ],
    name: 'AccessRevoked',
    type: 'event'
  },
  {
    inputs: [
      { internalType: 'address', name: 'patient', type: 'address' },
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'string', name: 'ipfsCid', type: 'string' }
    ],
    name: 'getEncryptedKeyShare',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'address', name: 'patient', type: 'address' }
    ],
    name: 'getGranteeAccess',
    outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'string', name: '', type: 'string' }
    ],
    name: 'grants',
    outputs: [
      { internalType: 'address', name: 'patient', type: 'address' },
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'string', name: 'ipfsCid', type: 'string' },
      { internalType: 'uint256', name: 'expiration', type: 'uint256' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'string', name: 'ipfsCid', type: 'string' },
      { internalType: 'uint256', name: 'expiration', type: 'uint256' },
      { internalType: 'bytes', name: 'encryptedKeyShare', type: 'bytes' }
    ],
    name: 'grantAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'patient', type: 'address' },
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'string', name: 'ipfsCid', type: 'string' }
    ],
    name: 'hasAccess',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'healthConsent',
    outputs: [{ internalType: 'contract IHealthConsent', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'medicalRecords',
    outputs: [{ internalType: 'contract IMedicalRecords', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'string', name: 'ipfsCid', type: 'string' }
    ],
    name: 'revokeAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Success Modal Component
const TransferSuccess = ({ txHash, grantee, ipfsCid, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700"
      >
        <div className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Access Granted Successfully!</h3>
          <p className="text-gray-300 text-sm mb-6">
            Access to your medical record has been securely granted on the BlockDAG blockchain.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg mb-4 text-left space-y-3">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">STATUS:</p>
              <p className="text-green-400 text-sm font-medium">✓ Transaction mined and executed</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">TRANSACTION HASH:</p>
              <p className="text-white font-mono text-xs break-all">{txHash}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">GRANTEE:</p>
              <p className="text-white font-mono text-xs break-all">{grantee}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">IPFS CID:</p>
              <p className="text-white font-mono text-xs break-all">{ipfsCid}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">TIMESTAMP:</p>
              <p className="text-gray-300 text-xs">{new Date().toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function TransferPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [records, setRecords] = useState<string[]>([]);
  const [selectedCid, setSelectedCid] = useState('');
  const [granteeAddress, setGranteeAddress] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState('');
  const [consentSigned, setConsentSigned] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('');

  // Check wallet and consent on mount
  useEffect(() => {
    const initialize = async () => {
      const storedWallet = sessionStorage.getItem('walletAddress');
      const storedConsent = sessionStorage.getItem('consentSigned');

      if (!storedWallet) {
        setError('No wallet connected. Please connect your wallet.');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }

      try {
        const normalizedWallet = ethers.getAddress(storedWallet);
        setWalletAddress(normalizedWallet);

        if (typeof window.ethereum === 'undefined') {
          setError('No Web3 wallet detected. Please install MetaMask.');
          return;
        }

        // Check network
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setNetworkStatus(`Connected to ${network.name} (Chain ID: ${network.chainId})`);

        if (Number(network.chainId) !== 1043) {
          setError('Please connect to BlockDAG network (Chain ID: 1043)');
          return;
        }

        const consentContract = new ethers.Contract(HEALTH_CONSENT_ADDRESS, HEALTH_CONSENT_ABI, provider);
        const [hasSigned] = await consentContract.getConsent(normalizedWallet);

        if (!hasSigned && storedConsent !== 'true') {
          setError('Consent not signed. Please sign consent in the dashboard.');
          setTimeout(() => window.location.href = '/dashboard', 2000);
          return;
        }

        setConsentSigned(true);
        await fetchRecords(normalizedWallet);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize. Please reconnect your wallet.');
        setTimeout(() => window.location.href = '/login', 2000);
      }
    };

    initialize();
  }, []);

  // Fetch user's medical records with better error handling
  const fetchRecords = async (address: string) => {
    setFetchingRecords(true);
    setError('');

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Web3 wallet detected.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if contract is deployed
      const code = await provider.getCode(MEDICAL_RECORDS_ADDRESS);
      if (code === '0x') {
        throw new Error('MedicalRecords contract not found at the specified address.');
      }

      const contract = new ethers.Contract(MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI, provider);
      console.log('Fetching records for address:', address);
      
      const userRecords = await contract.getRecords(address);
      console.log('Raw records from contract:', userRecords);
      
      // Filter out empty strings and validate CIDs
      const validRecords = userRecords.filter((cid: string) => 
        cid && cid.length > 0 && cid !== '0x'
      );
      
      console.log('Valid records:', validRecords);
      setRecords(validRecords);
      
      if (validRecords.length > 0 && !selectedCid) {
        setSelectedCid(validRecords[0]);
      }

      if (validRecords.length === 0) {
        setError('No medical records found for your wallet address.');
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      let errorMessage = 'Failed to fetch medical records. ';
      
      if (error.message.includes('contract not found')) {
        errorMessage += 'Contract not deployed. ';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network error. ';
      } else if (error.message.includes('revert')) {
        errorMessage += 'Contract execution reverted. ';
      }
      
      errorMessage += 'Please ensure you have uploaded medical records and are on the correct network.';
      setError(errorMessage);
    } finally {
      setFetchingRecords(false);
    }
  };

  // Get the encryption key for a specific CID
const getEncryptionKeyForCid = async (cid: string): Promise<string> => {
  try {
    // Check sessionStorage first
    const storedKey = sessionStorage.getItem(`encryptionKey_${cid}`);
    if (storedKey) {
      console.log('Found encryption key in session storage for CID:', cid);
      return storedKey;
    }

    // Verify record exists in contract
    const provider = new ethers.BrowserProvider(window.ethereum);
    const medicalRecordsContract = new ethers.Contract(MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI, provider);
    const patientRecords = await medicalRecordsContract.getRecords(walletAddress);
    const recordExists = patientRecords.some((record: string) => record === cid);
    if (!recordExists) {
      throw new Error(`Record with CID ${cid} not found for patient ${walletAddress}. Please ensure it was uploaded with this wallet.`);
    }

    // Try fetching key share from contract
    console.log('Fetching key share from contract for CID:', cid);
    const keyShare = await medicalRecordsContract.getKeyShare(cid);
    if (keyShare && keyShare !== '0x') {
      const keyHex = ethers.hexlify(keyShare);
      console.log('Retrieved key share from contract:', keyHex);
      sessionStorage.setItem(`encryptionKey_${cid}`, keyHex);
      return keyHex;
    }

    // Fallback: Regenerate key if user is the patient
    const signer = await provider.getSigner();
    const connectedAddress = await signer.getAddress();
    const normalizedAddress = ethers.getAddress(connectedAddress);
    const timestamp = sessionStorage.getItem(`uploadTimestamp_${cid}`);
    if (normalizedAddress.toLowerCase() === walletAddress.toLowerCase() && timestamp) {
      console.log('Regenerating key for CID:', cid);
      const message = `HealthSecure: Generate encryption key for ${walletAddress} at ${timestamp}`;
      const signature = await signer.signMessage(message);
      const signatureBuffer = new TextEncoder().encode(signature);
      const salt = new TextEncoder().encode('healthsecure-salt');
      const baseKey = await crypto.subtle.importKey(
        'raw',
        signatureBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        baseKey,
        256
      );
      const key = new Uint8Array(derivedBits);
      const keyHex = ethers.hexlify(key);
      sessionStorage.setItem(`encryptionKey_${cid}`, keyHex);
      return keyHex;
    }

    throw new Error('No encryption key found for this record. Ensure you are the patient who uploaded it.');
  } catch (error) {
    console.error('Error getting encryption key:', error);
    let errorMessage = 'Failed to retrieve encryption key.';
    if (error.reason === 'No access to this record') {
      errorMessage = 'You do not have access to this record’s encryption key. Ensure you are using the wallet that uploaded the record.';
    } else if (error.message.includes('Record with CID')) {
      errorMessage = error.message;
    } else {
      errorMessage = `Failed to retrieve encryption key: ${error.reason || error.message}`;
    }
    throw new Error(errorMessage);
  }
};
const verifyRecordExists = async (cid: string, patientAddress: string): Promise<boolean> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI, provider);
    
    const records = await contract.getRecords(patientAddress);
    console.log('All records for patient:', records);
    console.log('Looking for CID:', cid);
    
    const exists = records.some((record: string) => record === cid);
    console.log('Record exists:', exists);
    
    return exists;
  } catch (error) {
    console.error('Error verifying record:', error);
    return false;
  }
};
  // Grant access to a grantee using the MedicalRecordAccess contract
  const handleGrantAccess = async () => {
  setLoading(true);
  setError('');

  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No Web3 wallet detected. Please install MetaMask.');
    }

    // Input validation
    if (!ethers.isAddress(granteeAddress)) {
      throw new Error('Invalid grantee address.');
    }
    if (!selectedCid) {
      throw new Error('Please select a medical record.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const connectedAddress = await signer.getAddress();
    const normalizedAddress = ethers.getAddress(connectedAddress);
    const normalizedGrantee = ethers.getAddress(granteeAddress);

    if (normalizedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Wallet address mismatch. Please reconnect your wallet.');
    }

    // Verify consent
    const consentContract = new ethers.Contract(HEALTH_CONSENT_ADDRESS, HEALTH_CONSENT_ABI, provider);
    const [hasSigned] = await consentContract.getConsent(normalizedAddress);
    if (!hasSigned) {
      throw new Error('Consent not signed. Please sign consent in the dashboard.');
    }

    // Verify the record exists for this patient
    const medicalRecordsContract = new ethers.Contract(MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI, provider);
    const patientRecords = await medicalRecordsContract.getRecords(normalizedAddress);
    
    const recordExists = patientRecords.some((record: string) => record === selectedCid);
    if (!recordExists) {
      throw new Error('Selected record not found in your medical records. Please refresh and try again.');
    }

    // Get the encryption key for the selected CID
    console.log('Getting encryption key for CID:', selectedCid);
    const encryptionKey = await getEncryptionKeyForCid(selectedCid);
    
    if (!encryptionKey) {
      throw new Error('Encryption key not found for this record. Please ensure you are using the same wallet that uploaded the file.');
    }

    // Calculate expiration timestamp (0 for indefinite)
    const expiration = parseInt(expirationDays) > 0 
      ? Math.floor(Date.now() / 1000) + parseInt(expirationDays) * 86400 
      : 0;

    console.log('Granting access with parameters:', {
      grantee: normalizedGrantee,
      cid: selectedCid,
      expiration,
      keyLength: encryptionKey.length
    });

    // Use the MedicalRecordAccess contract
    const contract = new ethers.Contract(MEDICAL_RECORD_ACCESS_ADDRESS, MEDICAL_RECORD_ACCESS_ABI, signer);
    
    // Convert encryption key to bytes - FIXED: Use hex data instead of UTF-8
    let encryptedKeyBytes;
    try {
      // If the key is already in hex format, use it directly
      if (encryptionKey.startsWith('0x')) {
        encryptedKeyBytes = encryptionKey;
      } else {
        // Otherwise, convert to hex
        encryptedKeyBytes = ethers.hexlify(ethers.toUtf8Bytes(encryptionKey));
      }
    } catch (error) {
      console.error('Error converting encryption key:', error);
      throw new Error('Failed to process encryption key. Please try refreshing the page.');
    }

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await contract.grantAccess.estimateGas(
        normalizedGrantee, 
        selectedCid, 
        expiration, 
        encryptedKeyBytes,
        { from: normalizedAddress }
      );
    } catch (estimateError) {
      console.error('Gas estimation failed:', estimateError);
      throw new Error(`Gas estimation failed: ${estimateError.reason || estimateError.message}`);
    }
    
    const gasLimit = (gasEstimate * 120n) / 100n; // Add 20% buffer

    // Send transaction
    console.log('Sending grantAccess transaction...');
    const tx = await contract.grantAccess(
      normalizedGrantee, 
      selectedCid, 
      expiration, 
      encryptedKeyBytes, 
      { gasLimit }
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error('Transaction failed with status 0.');
    }

    console.log('Transaction confirmed:', receipt);
    setSuccessTxHash(receipt.hash);
    setShowSuccess(true);
    setGranteeAddress('');
    setExpirationDays('7');
    
    // Refresh records after successful transfer
    await fetchRecords(walletAddress);
    
  } catch (error) {
    console.error('Error granting access:', error);
    let errorMessage = 'Failed to grant access on blockchain.';
    
    if (error.code === 4001) {
      errorMessage = 'Transaction rejected by user.';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas. Please fund your wallet.';
    } else if (error.code === 'CALL_EXCEPTION') {
      errorMessage = error.reason || 'Contract execution failed. Verify contract address and parameters.';
    } else if (error.code === 'INVALID_ARGUMENT') {
      errorMessage = 'Invalid input parameters. Check grantee address and IPFS CID.';
    } else if (error.code === -32603) {
      errorMessage = error.reason || 'Internal blockchain error. Try again or check network status.';
    } else if (error.message) {
      errorMessage = error.reason || error.message;
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Disconnect wallet
  const handleDisconnect = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  // Refresh records
  const handleRefreshRecords = () => {
    if (walletAddress) {
      fetchRecords(walletAddress);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-white font-semibold text-xl">HealthSecure - Transfer Records</h1>
                <p className="text-gray-400 text-xs">Powered by BlockDAG</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">Connected</p>
                <p className="text-gray-400 text-xs font-mono">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
                </p>
                {networkStatus && (
                  <p className="text-green-400 text-xs">{networkStatus}</p>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
              {error.includes('No medical records found') && (
                <button
                  onClick={() => window.location.href = '/dashboard/upload'}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Upload Medical Records
                </button>
              )}
              {error.includes('Encryption key not found') && (
                <button
                  onClick={handleRefreshRecords}
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Keys
                </button>
              )}
            </div>
            <button onClick={() => setError('')} className="ml-auto text-gray-400 hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Transfer Medical Records</h2>
          <p className="text-gray-400">
            Securely grant access to your encrypted medical records on the BlockDAG blockchain.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg">Your Medical Records</h3>
            <button
              onClick={handleRefreshRecords}
              disabled={fetchingRecords}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingRecords ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {fetchingRecords ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400">Loading records from blockchain...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No medical records found</p>
              <p className="text-gray-500 text-sm mt-1">
                <a href="/dashboard/upload" className="text-blue-400 hover:text-blue-300">
                  Upload records
                </a>{' '}
                in the dashboard to share them
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {records.map((cid, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedCid(cid)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCid === cid ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm">Medical Record {index + 1}</p>
                        <p className="text-gray-400 text-xs font-mono break-all">{cid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-3 h-3" />
                        View Encrypted
                      </a>
                      {selectedCid === cid && (
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {records.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">Grant Access</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Grantee Address (Healthcare Provider)
                </label>
                <input
                  type="text"
                  value={granteeAddress}
                  onChange={(e) => setGranteeAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={loading}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-800 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Expiration (Days, 0 for Indefinite)
                </label>
                <input
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  min={0}
                  disabled={loading}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-800 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-400">
                  Selected Record: 
                  <span className="text-white font-mono ml-2">
                    {selectedCid ? `${selectedCid.slice(0, 12)}...${selectedCid.slice(-8)}` : 'None'}
                  </span>
                </div>
                <div className="text-gray-400">
                  Records Found: 
                  <span className="text-white ml-2">{records.length}</span>
                </div>
              </div>

              <button
                onClick={handleGrantAccess}
                disabled={loading || !selectedCid || !granteeAddress || fetchingRecords || !ethers.isAddress(granteeAddress)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Granting Access...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Grant Access on BlockDAG
                  </>
                )}
              </button>
              
              {!ethers.isAddress(granteeAddress) && granteeAddress && (
                <p className="text-red-400 text-sm">Please enter a valid Ethereum address</p>
              )}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showSuccess && (
          <TransferSuccess
            txHash={successTxHash}
            grantee={granteeAddress}
            ipfsCid={selectedCid}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}