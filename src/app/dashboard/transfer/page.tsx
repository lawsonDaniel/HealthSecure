'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Send, CheckCircle, AlertCircle, Eye, RefreshCw, X } from 'lucide-react';
import { ethers } from 'ethers';

// Contract addresses
const MEDICAL_RECORDS_ADDRESS = ethers.getAddress('0x96081A4b38AcBbc4dAAbc72178AF8C2818DC9652');
const HEALTH_CONSENT_ADDRESS = ethers.getAddress('0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157');
const MEDICAL_RECORD_ACCESS_ADDRESS = ethers.getAddress('0xB0a0F736787BBb0Dcce03E0b2DAae59d008B9D2b');

// Contract ABIs (same as provided, included for completeness)
const MEDICAL_RECORDS_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_healthConsentAddress", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "patient", type: "address" },
      { indexed: true, internalType: "address", name: "authorized", type: "address" },
      { indexed: false, internalType: "string", name: "ipfsCid", type: "string" }
    ],
    name: "AccessGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "patient", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
      { indexed: false, internalType: "string", name: "ipfsCid", type: "string" }
    ],
    name: "RecordUploaded",
    type: "event"
  },
  {
    inputs: [
      { internalType: "string", name: "_ipfsCid", type: "string" }
    ],
    name: "getKeyShare",
    outputs: [
      { internalType: "bytes", name: "", type: "bytes" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_patient", type: "address" }
    ],
    name: "getRecords",
    outputs: [
      { internalType: "string[]", name: "", type: "string[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_authorized", type: "address" },
      { internalType: "string", name: "_ipfsCid", type: "string" },
      { internalType: "bytes", name: "_encryptedKeyShare", type: "bytes" }
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
      { internalType: "contract IHealthConsent", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "_ipfsCid", type: "string" },
      { internalType: "bytes", name: "_selfEncryptedKeyShare", type: "bytes" }
    ],
    name: "uploadRecord",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const HEALTH_CONSENT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_patient", type: "address" }
    ],
    name: "getConsent",
    outputs: [
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "string", name: "", type: "string" }
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

// Derive encryption key (copied from Dashboard for consistency)
const deriveEncryptionKey = async (timestamp: number, targetWalletAddress: string): Promise<Uint8Array> => {
  if (!window.ethereum) {
    throw new Error('No Web3 wallet detected. Please install MetaMask.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Recreate the exact same message used during upload
    const message = `HealthSecure: Generate encryption key for ${targetWalletAddress} at ${timestamp}`;
    
    console.log('Deriving key with message:', message);
    
    // Sign the same message to regenerate the same signature
    const signature = await signer.signMessage(message);
    console.log('Signature obtained for key derivation');
    
    // Use the signature to derive the same 256-bit key using PBKDF2
    const signatureBuffer = new TextEncoder().encode(signature);
    const salt = new TextEncoder().encode('healthsecure-salt');
    
    // Import key for derivation
    const baseKey = await crypto.subtle.importKey(
      'raw',
      signatureBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive 256-bit key (same parameters as upload)
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      256 // 256 bits = 32 bytes for AES-256
    );
    
    const key = new Uint8Array(derivedBits);
    console.log('Key derived successfully, length:', key.length, 'bytes');
    
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length} bytes, expected 32 bytes`);
    }
    
    return key;
  } catch (err) {
    console.error('Key derivation error:', err);
    throw new Error(`Failed to derive encryption key: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};

// Success Modal Component (unchanged)
const TransferSuccess = ({ txHash, grantee, ipfsCid, onClose }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-white mb-2 text-center">
            Access Granted Successfully!
          </h3>
          
          <p className="text-gray-300 text-sm mb-6 text-center">
            The grantee can now access the encrypted medical record using their wallet.
          </p>

          <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">STATUS:</p>
              <p className="text-green-400 text-sm font-medium">✓ Transaction confirmed on BlockDAG</p>
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
              <p className="text-gray-400 text-xs font-medium mb-1">ENCRYPTED FILE:</p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs break-all underline"
              >
                https://gateway.pinata.cloud/ipfs/{ipfsCid}
              </a>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-between"
            >
              <span>View Access Instructions for Grantee</span>
              <span>{showInstructions ? '▲' : '▼'}</span>
            </button>
            
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 bg-gray-700 p-4 rounded-lg text-sm"
              >
                <p className="text-gray-300 mb-2">
                  <strong>To access the file, the grantee should:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li>Connect their wallet to HealthSecure</li>
                  <li>Visit the "Access Records" page</li>
                  <li>Select your patient address</li>
                  <li>Enter the IPFS CID: <code className="bg-gray-800 px-1 rounded">{ipfsCid}</code></li>
                  <li>Click "Decrypt and Download"</li>
                </ol>
                <p className="text-gray-400 text-xs mt-2">
                  The system will automatically verify access permissions and decrypt the file.
                </p>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(ipfsCid);
                // Show copied notification
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Copy CID
            </button>
          </div>
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

  // Fetch user's medical records
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
      
      // Filter out invalid CIDs
      const validRecords = userRecords.filter((cid: string) => 
        cid && cid.length > 0 && cid !== '0x' && cid.startsWith('bafy')
      );
      
      console.log('Valid records:', validRecords);
      setRecords(validRecords);
      
      if (validRecords.length > 0 && !selectedCid) {
        setSelectedCid(validRecords[0]);
      }

      if (validRecords.length === 0) {
        setError('No medical records found for your wallet address. Please upload a record first.');
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      let errorMessage = 'Failed to fetch medical records. ';
      
      if (error.message?.includes('contract not found')) {
        errorMessage += 'Contract not deployed. ';
      } else if (error.message?.includes('network')) {
        errorMessage += 'Network error. ';
      } else if (error.message?.includes('revert')) {
        errorMessage += 'Contract execution reverted. ';
      }
      
      errorMessage += 'Please ensure you have uploaded medical records and are on the correct network.';
      setError(errorMessage);
    } finally {
      setFetchingRecords(false);
    }
  };

  // Retrieve encryption key for CID
  const getEncryptionKeyForCid = async (cid: string): Promise<string> => {
    try {
      // Try to get key material from session storage
      const storedKeyMaterial = sessionStorage.getItem(`encryptionKey_${cid}`);
      if (!storedKeyMaterial) {
        throw new Error(`No encryption key found for CID ${cid} in session storage.`);
      }

      let keyMaterial;
      try {
        keyMaterial = JSON.parse(storedKeyMaterial);
      } catch (parseError) {
        console.error('Error parsing key material:', parseError);
        throw new Error('Invalid key material format in session storage.');
      }

      if (!keyMaterial || !keyMaterial.walletAddress || !keyMaterial.timestamp) {
        throw new Error('Invalid key material: missing walletAddress or timestamp.');
      }

      console.log('Key material found:', keyMaterial);

      // Verify the wallet address matches
      const normalizedWallet = ethers.getAddress(keyMaterial.walletAddress);
      if (normalizedWallet.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Wallet mismatch: the record was uploaded by a different wallet.');
      }

      // Derive the key using the stored timestamp and wallet address
      const timestamp = parseInt(keyMaterial.timestamp);
      if (isNaN(timestamp)) {
        throw new Error('Invalid timestamp in key material.');
      }

      const key = await deriveEncryptionKey(timestamp, normalizedWallet);
      const keyHex = '0x' + Buffer.from(key).toString('hex');
      console.log('Derived key hex:', keyHex);

      // Store the derived key hex for future use
      sessionStorage.setItem(`encryptionKey_${cid}`, JSON.stringify({
        walletAddress: normalizedWallet,
        timestamp: timestamp,
        keyHex: keyHex
      }));

      return keyHex;
    } catch (error) {
      console.error('Error getting encryption key:', error);

      // Try to fetch from contract as a fallback
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI, provider);
        const keyShare = await contract.getKeyShare(cid);
        
        if (keyShare && keyShare !== '0x') {
          const keyHex = ethers.hexlify(keyShare);
          console.log('Retrieved key share from contract:', keyHex);
          
          // Store in session storage for future use
          sessionStorage.setItem(`encryptionKey_${cid}`, JSON.stringify({
            walletAddress: walletAddress,
            timestamp: Date.now(),
            keyHex: keyHex
          }));
          return keyHex;
        }
        
        throw new Error('No key share found in contract.');
      } catch (contractError) {
        console.error('Contract key retrieval failed:', contractError);
        throw new Error(`Failed to retrieve encryption key: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Verify CID ownership
  async function verifyCidOwnership(cid: string, patientAddress: string): Promise<boolean> {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI, provider);
    
    // Check if CID exists in patient's records
    console.log(`Verifying CID ${cid} for patient ${patientAddress}`);
    const records = await contract.getRecords(patientAddress);
    console.log('Records for patient:', records);
    
    const recordExists = records.includes(cid);
    if (!recordExists) {
      console.warn(`CID ${cid} not found in patient's records.`);
      setError(`Record with CID ${cid} not found in your records. Please ensure it was uploaded correctly.`);
      return false;
    }

    // Verify ownership via getKeyShare
    try {
      console.log(`Calling getKeyShare for CID ${cid}`);
      const keyShare = await contract.getKeyShare(cid);
      console.log('Key share retrieved:', keyShare);
      return keyShare && keyShare !== '0x';
    } catch (keyError) {
      console.error('Error calling getKeyShare:', keyError);
      setError(`Failed to retrieve key share: ${keyError.reason || keyError.message || 'No access to this record'}`);
      return false;
    }
  } catch (error) {
    console.error('Error in verifyCidOwnership:', error);
    setError(`Failed to verify CID ownership: ${error.reason || error.message || 'Unknown error'}`);
    return false;
  }
}

  // Grant access to a record
  const handleGrantAccess = async () => {
  setLoading(true);
  setError('');

  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No Web3 wallet detected.');
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
    let hasSigned = false;
    try {
      console.log('Checking consent for address:', normalizedAddress);
      [hasSigned] = await consentContract.getConsent(normalizedAddress);
      console.log('Consent status:', hasSigned);
    } catch (consentError) {
      console.error('Consent check error:', consentError);
      throw new Error(
        `Failed to verify consent: ${
          consentError.reason || consentError.message || 'Contract call reverted. Please ensure you have signed the consent.'
        }`
      );
    }

    if (!hasSigned) {
      throw new Error('Consent not signed. Please sign consent in the dashboard.');
    }

    // Verify record ownership
    console.log('Verifying record ownership for CID:', selectedCid);
    const isOwner = await verifyCidOwnership(selectedCid, normalizedAddress);
    if (!isOwner) {
      throw new Error(
        `Record with CID ${selectedCid} not found or not owned by you. Please ensure the record was uploaded correctly or re-upload it from the dashboard.`
      );
    }

    // Get encryption key
    console.log('Getting encryption key for CID:', selectedCid);
    let encryptionKey = await getEncryptionKeyForCid(selectedCid);

    // Ensure encryptionKey is a valid hex string
    if (!encryptionKey.startsWith('0x')) {
      encryptionKey = '0x' + encryptionKey;
    }
    if (!/^0x[0-9a-fA-F]+$/.test(encryptionKey)) {
      throw new Error('Invalid encryption key format.');
    }

    // Truncate or pad key to 32 bytes (64 hex chars + 0x)
    const keyBytes = ethers.hexlify(ethers.toUtf8Bytes(encryptionKey)).padEnd(66, '0').slice(0, 66);

    // Calculate expiration timestamp
    const expiration = parseInt(expirationDays) > 0 
      ? Math.floor(Date.now() / 1000) + parseInt(expirationDays) * 86400 
      : 0;

    console.log('Grant access parameters:', {
      grantee: normalizedGrantee,
      cid: selectedCid,
      expiration,
      keyBytes: keyBytes.substring(0, 20) + '...'
    });

    // Use MedicalRecordAccess contract
    const contract = new ethers.Contract(MEDICAL_RECORD_ACCESS_ADDRESS, MEDICAL_RECORD_ACCESS_ABI, signer);

    // Test static call
    console.log('Testing static call...');
    try {
      await contract.grantAccess.staticCall(
        normalizedGrantee,
        selectedCid,
        expiration,
        keyBytes,
        { from: normalizedAddress }
      );
      console.log('Static call successful');
    } catch (staticCallError) {
      console.error('Static call failed:', staticCallError);
      throw new Error(`Static call failed: ${staticCallError.reason || staticCallError.message || 'Unknown error'}`);
    }

    // Estimate gas
    const gasEstimate = await contract.grantAccess.estimateGas(
      normalizedGrantee,
      selectedCid,
      expiration,
      keyBytes,
      { from: normalizedAddress }
    );
    console.log('Gas estimate:', gasEstimate.toString());
    const gasLimit = (gasEstimate * 120n) / 100n;

    // Send transaction
    console.log('Sending grantAccess transaction...');
    const tx = await contract.grantAccess(
      normalizedGrantee,
      selectedCid,
      expiration,
      keyBytes,
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

    // Refresh records
    await fetchRecords(walletAddress);

  } catch (error) {
    console.error('Error granting access:', error);
    let errorMessage = 'Failed to grant access on blockchain.';

    if (error.code === 4001) {
      errorMessage = 'Transaction rejected by user.';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas. Please fund your wallet.';
    } else if (error.code === 'CALL_EXCEPTION') {
      errorMessage = error.reason || 'Contract execution failed. Please check the CID, grantee address, and ensure the record exists.';
    } else if (error.message.includes('Consent not signed')) {
      errorMessage = error.message + ' Redirecting to dashboard...';
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } else if (error.message.includes('not found or not owned')) {
      errorMessage = error.message + ' Redirecting to upload page...';
      setTimeout(() => window.location.href = '/dashboard/upload', 2000);
    } else {
      errorMessage = error.reason || error.message || 'Unknown error occurred.';
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
              {error.includes('encryption key') && (
                <button
                  onClick={handleRefreshRecords}
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Records
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