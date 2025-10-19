'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ethers } from 'ethers';

// Import contract addresses and ABIs from your existing code
const MEDICAL_RECORD_ACCESS_ADDRESS = ethers.getAddress('0xC379206a95B6bb841ac97F4ff15927218465694C');
const MEDICAL_RECORDS_ADDRESS = ethers.getAddress('0x96081A4b38AcBbc4dAAbc72178AF8C2818DC9652');

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

const AccessPage = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [accessibleCids, setAccessibleCids] = useState<string[]>([]);
  const [selectedCid, setSelectedCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [error, setError] = useState('');
  const [decryptedFileUrl, setDecryptedFileUrl] = useState('');
  const [networkStatus, setNetworkStatus] = useState('');

  // Initialize wallet connection
  useEffect(() => {
    const initialize = async () => {
      const storedWallet = sessionStorage.getItem('walletAddress');
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

        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setNetworkStatus(`Connected to ${network.name} (Chain ID: ${network.chainId})`);

        if (Number(network.chainId) !== 1043) {
          setError('Please connect to BlockDAG network (Chain ID: 1043)');
          return;
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize. Please reconnect your wallet.');
        setTimeout(() => window.location.href = '/login', 2000);
      }
    };

    initialize();
  }, []);

  // Fetch accessible records for the grantee
  const fetchAccessibleRecords = async (grantee: string, patient: string) => {
    setFetchingRecords(true);
    setError('');

    try {
      if (!ethers.isAddress(patient)) {
        throw new Error('Invalid patient address.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(MEDICAL_RECORD_ACCESS_ADDRESS, MEDICAL_RECORD_ACCESS_ABI, provider);
      const cids = await contract.getGranteeAccess(grantee, patient);
      const validCids = cids.filter((cid: string) => cid && cid.length > 0);

      setAccessibleCids(validCids);
      if (validCids.length > 0 && !selectedCid) {
        setSelectedCid(validCids[0]);
      }
      if (validCids.length === 0) {
        setError('No accessible medical records found for this patient.');
      }
    } catch (error) {
      console.error('Error fetching accessible records:', error);
      setError(`Failed to fetch records: ${error.message || 'Unknown error'}`);
    } finally {
      setFetchingRecords(false);
    }
  };

  // Regenerate encryption key using stored key material
  const regenerateEncryptionKey = async (keyMaterial: any): Promise<Uint8Array> => {
    try {
      const { timestamp, walletAddress: storedWallet } = keyMaterial;
      const message = `HealthSecure: Generate encryption key for ${storedWallet} at ${timestamp}`;
      const signature = await new ethers.BrowserProvider(window.ethereum).getSigner().signMessage(message);
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

      return new Uint8Array(derivedBits);
    } catch (err) {
      console.error('Error regenerating encryption key:', err);
      throw new Error('Failed to regenerate encryption key.');
    }
  };

  // Decrypt file using the encryption key
  const decryptFile = async (encryptedData: ArrayBuffer, key: Uint8Array): Promise<Blob> => {
    try {
      const dataView = new Uint8Array(encryptedData);
      const iv = dataView.slice(0, 16);
      const encryptedContent = dataView.slice(16);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt']
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: iv
        },
        cryptoKey,
        encryptedContent
      );

      // Retrieve original file metadata
      const originalFileName = sessionStorage.getItem(`originalFileName_${selectedCid}`) || 'decrypted_file';
      const originalFileType = sessionStorage.getItem(`originalFileType_${selectedCid}`) || 'application/octet-stream';

      return new Blob([decryptedBuffer], { type: originalFileType });
    } catch (err) {
      console.error('Decryption error:', err);
      throw new Error('Failed to decrypt file.');
    }
  };

  // Handle file access and decryption
  const handleAccessFile = async () => {
    setLoading(true);
    setError('');
    setDecryptedFileUrl('');

    try {
      if (!selectedCid) {
        throw new Error('Please select a medical record.');
      }
      if (!ethers.isAddress(patientAddress)) {
        throw new Error('Invalid patient address.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(MEDICAL_RECORD_ACCESS_ADDRESS, MEDICAL_RECORD_ACCESS_ABI, provider);
      const keyShare = await contract.getEncryptedKeyShare(patientAddress, selectedCid);

      if (!keyShare || keyShare === '0x') {
        throw new Error('No encryption key share found for this record.');
      }

      // Parse the key material
      let keyMaterial;
      try {
        keyMaterial = JSON.parse(ethers.toUtf8String(keyShare));
      } catch (err) {
        throw new Error('Invalid key share format.');
      }

      // Regenerate the encryption key
      const encryptionKey = await regenerateEncryptionKey(keyMaterial);

      // Download encrypted file from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${selectedCid}`);
      if (!response.ok) {
        throw new Error('Failed to download encrypted file from IPFS.');
      }
      const encryptedData = await response.arrayBuffer();

      // Decrypt the file
      const decryptedBlob = await decryptFile(encryptedData, encryptionKey);

      // Create a downloadable URL
      const url = URL.createObjectURL(decryptedBlob);
      setDecryptedFileUrl(url);

    } catch (error) {
      console.error('Error accessing file:', error);
      setError(`Failed to access or decrypt file: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-white font-semibold text-xl">HealthSecure - Access Records</h1>
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
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-gray-400 hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Access Medical Records</h2>
          <p className="text-gray-400">View and decrypt medical records you have been granted access to.</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-white font-semibold text-lg mb-4">Select Patient</h3>
          <input
            type="text"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            placeholder="Patient address (0x...)"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => fetchAccessibleRecords(walletAddress, patientAddress)}
            disabled={fetchingRecords || !ethers.isAddress(patientAddress)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
          >
            Fetch Records
          </button>
        </div>

        {accessibleCids.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">Accessible Records</h3>
            {fetchingRecords ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading records from blockchain...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {accessibleCids.map((cid, index) => (
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
                      {selectedCid === cid && (
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <button
              onClick={handleAccessFile}
              disabled={loading || !selectedCid}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accessing & Decrypting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Access and Decrypt Record
                </>
              )}
            </button>
            {decryptedFileUrl && (
              <a
                href={decryptedFileUrl}
                download={`decrypted_record_${selectedCid.slice(0, 8)}.${sessionStorage.getItem(`originalFileType_${selectedCid}`)?.includes('pdf') ? 'pdf' : 'txt'}`}
                className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Download Decrypted File
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AccessPage;