'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UploadCloud, FileText, AlertCircle, CheckCircle, Activity, LogOut } from 'lucide-react';
import { ethers } from 'ethers';

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [verification, setVerification] = useState('');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [consentSigned, setConsentSigned] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);

  const healthConsentAddr = ethers.getAddress('0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157');
  const medicalRecordsAddr = ethers.getAddress('0x96081A4b38AcBbc4dAAbc72178AF8C2818DC9652');

 const medicalRecordsABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_healthConsentAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "patient",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "authorized",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsCid",
          "type": "string"
        }
      ],
      "name": "AccessGranted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "patient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsCid",
          "type": "string"
        }
      ],
      "name": "RecordUploaded",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_ipfsCid",
          "type": "string"
        }
      ],
      "name": "getKeyShare",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_patient",
          "type": "address"
        }
      ],
      "name": "getRecords",
      "outputs": [
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_authorized",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_ipfsCid",
          "type": "string"
        },
        {
          "internalType": "bytes",
          "name": "_encryptedKeyShare",
          "type": "bytes"
        }
      ],
      "name": "grantAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "healthConsent",
      "outputs": [
        {
          "internalType": "contract IHealthConsent",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_ipfsCid",
          "type": "string"
        },
        {
          "internalType": "bytes",
          "name": "_selfEncryptedKeyShare",
          "type": "bytes"
        }
      ],
      "name": "uploadRecord",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const healthConsentABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_patient",
          "type": "address"
        }
      ],
      "name": "getConsent",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Check wallet connection and consent status on component mount
  useEffect(() => {
    const checkWalletAndConsent = async () => {
      const storedWallet = sessionStorage.getItem('walletAddress');
      const storedConsent = sessionStorage.getItem('consentSigned');

      if (!storedWallet) {
        window.location.href = '/login';
        return;
      }

      try {
        const normalizedWallet = ethers.getAddress(storedWallet);
        setWalletAddress(normalizedWallet);

        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(healthConsentAddr, healthConsentABI, provider);
          
          try {
            const [hasSigned] = await contract.getConsent(normalizedWallet);
            setConsentSigned(hasSigned);
            if (!hasSigned && storedConsent !== 'true') {
              setError('Consent not signed. Please sign consent agreement on the dashboard first.');
            }
          } catch (consentError) {
            console.error('Error checking consent status:', consentError);
            setError('Failed to verify consent status. Please try again.');
          }
        } else {
          setConsentSigned(storedConsent === 'true');
          if (storedConsent !== 'true') {
            setError('Consent not signed. Please sign consent agreement on the dashboard first.');
          }
        }
      } catch (err) {
        console.error('Invalid wallet address:', err);
        setError('Invalid wallet address. Please reconnect your wallet.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } finally {
        setCheckingConsent(false);
      }
    };

    checkWalletAndConsent();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFile = e.dataTransfer.files[0];
      handleFileValidation(newFile);
    }
  }, []);

  const handleFileValidation = (newFile: File) => {
    setError('');
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(newFile.type)) {
      setError('Only PDF or TXT files are supported.');
      return;
    }
    if (newFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20MB limit.');
      return;
    }
    setFile(newFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      handleFileValidation(newFile);
    }
  };

  // Generate encryption key from wallet signature - FIXED VERSION
  const generateEncryptionKey = async (): Promise<{ key: Uint8Array; keyHash: string; timestamp: number }> => {
    if (!window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask.');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Generate unique message for this upload using wallet address and timestamp
      const timestamp = Date.now();
      const message = `HealthSecure: Generate encryption key for ${walletAddress} at ${timestamp}`;
      
      console.log('Generating key with message:', message);
      
      // Sign message to generate deterministic key
      const signature = await signer.signMessage(message);
      
      // Use the signature to derive a proper 256-bit key using PBKDF2
      const signatureBuffer = new TextEncoder().encode(signature);
      const salt = new TextEncoder().encode('healthsecure-salt');
      
      // Import key for derivation
      const baseKey = await crypto.subtle.importKey(
        'raw',
        signatureBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      // Derive 256-bit key
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
      const keyHash = ethers.keccak256(key);
      
      console.log('Key generated successfully. Timestamp:', timestamp, 'Key length:', key.length);
      
      return { key, keyHash, timestamp };
    } catch (err) {
      console.error('Error generating encryption key:', err);
      throw new Error(
        err instanceof Error
          ? err.message
          : 'Failed to generate encryption key. Please ensure your wallet is connected and unlocked.'
      );
    }
  };

  // Simple AES encryption using Web Crypto API
  const encryptFile = async (file: File, key: Uint8Array): Promise<{ encryptedFile: File; iv: string }> => {
    try {
      const buffer = await file.arrayBuffer();
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(16));
      const ivHex = Buffer.from(iv).toString('hex');
      
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { 
          name: 'AES-CBC',
          length: 256
        },
        false,
        ['encrypt']
      );
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-CBC',
          iv: iv
        },
        cryptoKey,
        buffer
      );
      
      // Create encrypted file with IV prepended
      const encryptedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      encryptedData.set(iv);
      encryptedData.set(new Uint8Array(encryptedBuffer), iv.length);
      
      const encryptedFile = new File([encryptedData], `encrypted_${file.name}`, {
        type: 'application/octet-stream',
      });
      
      console.log('File encrypted successfully. Original size:', buffer.byteLength, 'Encrypted size:', encryptedData.length);
      
      return { encryptedFile, iv: ivHex };
    } catch (err) {
      console.error('Encryption error:', err);
      throw new Error(`File encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const uploadToPinata = async (file: File): Promise<{ ipfsCid: string; verification: string; encryptionKey: string }> => {
    try {
      // Generate encryption key from wallet
      const { key, keyHash, timestamp } = await generateEncryptionKey();
      
      // Encrypt file
      const { encryptedFile } = await encryptFile(file, key);

      const formData = new FormData();
      formData.append('file', encryptedFile);
      formData.append('verify', 'true');

      console.log('Uploading to Pinata...');
      const response = await fetch('/api/upload-to-pinata', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata upload failed: ${errorData}`);
      }

      const result = await response.json();
      console.log('Pinata response:', result);
      if (!result.ipfsCid) {
        throw new Error('No IPFS CID returned from upload service');
      }

      // Store the key material for later decryption
      const keyMaterial = {
        timestamp: timestamp,
        keyHash: keyHash,
        walletAddress: walletAddress
      };
      
      return { ...result, encryptionKey: JSON.stringify(keyMaterial) };
    } catch (err) {
      console.error('Pinata upload error:', err);
      throw new Error(`Pinata upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const checkConsent = async (): Promise<boolean> => {
    if (!window.ethereum) throw new Error('No Web3 wallet detected.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(healthConsentAddr, healthConsentABI, provider);
    try {
      const [hasSigned] = await contract.getConsent(walletAddress);
      return hasSigned;
    } catch (error) {
      console.error('Error checking consent:', error);
      throw new Error('Failed to verify consent status on blockchain');
    }
  };

  const uploadToBlockDAG = async (ipfsCid: string, encryptionKey: string): Promise<string> => {
    if (!window.ethereum) throw new Error('No Web3 wallet detected.');

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const connectedAddress = await signer.getAddress();
    if (connectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Connected wallet does not match authorized wallet. Please reconnect.');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);
    const contract = new ethers.Contract(medicalRecordsAddr, medicalRecordsABI, signer);

    if (!ethers.isAddress(normalizedAddress)) {
      throw new Error('Invalid patient address');
    }
    if (!ipfsCid || typeof ipfsCid !== 'string' || ipfsCid.length === 0) {
      throw new Error('Invalid IPFS CID');
    }
    if (!encryptionKey || typeof encryptionKey !== 'string') {
      throw new Error('Invalid encryption key');
    }

    const hasConsent = await checkConsent();
    console.log('Consent status:', hasConsent);
    if (!hasConsent) {
      throw new Error('Consent verification failed. Please sign consent agreement first.');
    }

    try {
      const gasPrice = ethers.parseUnits('1', 'gwei');
      console.log('Gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');

      const iface = new ethers.Interface(medicalRecordsABI);
      const txData = iface.encodeFunctionData('uploadRecord', [
        ipfsCid,
        ethers.toUtf8Bytes(encryptionKey),
      ]);
      console.log('Transaction data:', { ipfsCid, encryptionKey, txData });

      let gasEstimate;
      try {
        gasEstimate = await contract.uploadRecord.estimateGas(ipfsCid, ethers.toUtf8Bytes(encryptionKey));
        console.log('Estimated gas:', gasEstimate.toString());
        if (!gasEstimate || isNaN(Number(gasEstimate))) {
          throw new Error('Invalid gas estimate returned');
        }
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error(`Gas estimation failed: ${gasError instanceof Error ? gasError.message : 'Unknown error'}`);
      }

      const txRequest = {
        to: medicalRecordsAddr,
        data: txData,
        from: normalizedAddress,
        gasPrice,
        gasLimit: (BigInt(gasEstimate) * BigInt(120)) / BigInt(100),
      };

      const tx = await signer.sendTransaction(txRequest);
      console.log('Transaction sent:', { txHash: tx.hash, data: tx.data });

      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction confirmation timed out')), 60000)
        ),
      ]);

      if (receipt.status !== 1) {
        throw new Error('Transaction failed on blockchain');
      }

      return receipt.hash;
    } catch (err: any) {
      console.error('Blockchain transaction error:', err);
      if (err.data) {
        try {
          const iface = new ethers.Interface(medicalRecordsABI);
          const reason = iface.parseError(err.data)?.args[0] || 'Unknown revert reason';
          throw new Error(`Transaction reverted: ${reason}`);
        } catch (decodeErr) {
          console.error('Failed to decode revert reason:', decodeErr);
        }
      }
      if (err.code === 'CALL_EXCEPTION') {
        throw new Error('Transaction failed: Contract execution reverted. Check consent status, input data, or contract logic.');
      }
      throw new Error(`Blockchain upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpload = async () => {
  if (!file) {
    setError('Please select a file.');
    return;
  }
  if (!walletAddress) {
    setError('Wallet not connected. Please reconnect.');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    return;
  }
  if (!consentSigned) {
    setError('Consent not signed. Please sign consent agreement on the dashboard first.');
    return;
  }

  setUploading(true);
  setError('');

  try {
    const hasConsent = await checkConsent();
    if (!hasConsent) {
      throw new Error('Consent verification failed. Please sign consent agreement first.');
    }

    console.log('Uploading to Pinata...');
    const { ipfsCid, verification, encryptionKey } = await uploadToPinata(file);
    setIpfsCid(ipfsCid);
    setVerification(verification);

    console.log('Uploading to BlockDAG...');
    const txHash = await uploadToBlockDAG(ipfsCid, encryptionKey);
    
    // Store the encryption key material and original file info
    const keyMaterial = JSON.parse(encryptionKey);
    sessionStorage.setItem(`encryptionKey_${ipfsCid}`, JSON.stringify(keyMaterial));
    sessionStorage.setItem(`uploadTimestamp_${ipfsCid}`, keyMaterial.timestamp.toString());
    sessionStorage.setItem(`walletAddress_${ipfsCid}`, walletAddress);
    
    // Store original file information for proper decryption
    sessionStorage.setItem(`originalFileName_${ipfsCid}`, file.name);
    sessionStorage.setItem(`originalFileType_${ipfsCid}`, file.type);
    
    console.log('Key material and file info stored for CID:', ipfsCid, {
      keyMaterial,
      originalFileName: file.name,
      originalFileType: file.type
    });
    
    setTxHash(txHash);
    setUploaded(true);
  } catch (err: any) {
    console.error('Upload error:', err);
    let errorMessage = 'Upload failed. Please try again.';
    if (err.message.includes('rejected')) {
      errorMessage = err.message.includes('signature')
        ? err.message
        : 'Transaction was rejected. Please try again.';
    } else if (err.message.includes('consent')) {
      errorMessage = err.message;
    } else if (err.message.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (err.message.includes('Transaction reverted')) {
      errorMessage = err.message;
    } else {
      errorMessage = err.message || 'Upload failed. Please try again.';
    }
    setError(errorMessage);
  } finally {
    setUploading(false);
  }
};
  const handleDisconnect = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };

  if (checkingConsent) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking wallet and consent status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-white font-semibold text-xl">HealthSecure - Upload Records</h1>
                <p className="text-gray-400 text-xs">
                  {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-400 hover:text-white flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleDisconnect}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${walletAddress ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
            <p className="text-sm font-medium">{walletAddress ? '✓ Wallet Connected' : '✗ Wallet Not Connected'}</p>
            <p className="text-xs text-gray-400 mt-1">
              {walletAddress ? `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Please connect your wallet'}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${consentSigned ? 'border-green-500/50 bg-green-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}>
            <p className="text-sm font-medium">{consentSigned ? '✓ Consent Signed' : '⚠ Consent Required'}</p>
            <p className="text-xs text-gray-400 mt-1">{consentSigned ? 'You can upload medical records' : 'Sign consent on dashboard first'}</p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">{error}</p>
              {error.includes('consent') && !consentSigned && (
                <button
                  onClick={handleBackToDashboard}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Go to Dashboard to Sign Consent
                </button>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!uploaded ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <UploadCloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Upload Medical Records</h2>
              <p className="text-gray-400 mb-8">Securely upload your encrypted records to Pinata/IPFS and BlockDAG for verification (max 20MB).</p>

              <div
                className={`border-2 border-dashed rounded-xl p-8 ${
                  dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
                } transition-colors ${!consentSigned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={consentSigned ? handleDrag : undefined}
                onDragLeave={consentSigned ? handleDrag : undefined}
                onDragOver={consentSigned ? handleDrag : undefined}
                onDrop={consentSigned ? handleDrop : undefined}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.txt"
                  onChange={consentSigned ? handleFileSelect : undefined}
                  className="hidden"
                  disabled={!consentSigned}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${!consentSigned ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className={`w-8 h-8 ${consentSigned ? 'text-gray-400' : 'text-gray-600'}`} />
                    <p className={consentSigned ? 'text-gray-300' : 'text-gray-500'}>
                      {consentSigned ? 'Drag & drop or click to select PDF/TXT file' : 'Please sign consent agreement first'}
                    </p>
                    {!consentSigned && (
                      <p className="text-yellow-500 text-sm mt-2">Consent required before uploading files</p>
                    )}
                  </div>
                </label>
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-white">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      onClick={() => setFile(null)}
                      className="ml-auto text-red-400 hover:text-red-300"
                      disabled={!consentSigned}
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading || !consentSigned || !walletAddress}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Encrypting & Uploading...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {consentSigned ? 'Upload & Verify with AI' : 'Sign Consent First'}
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
              <p className="text-gray-400 mb-8">Your record has been encrypted, uploaded to Pinata/IPFS, referenced on BlockDAG, and verified by Gemini AI.</p>

              <div className="bg-gray-800 p-6 rounded-lg mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  AI Verification Result
                </h3>
                <div className="text-left">
                  <p className="text-gray-300 whitespace-pre-wrap">{verification}</p>
                </div>
                {ipfsCid && (
                  <div className="mt-4">
                    <p className="text-gray-400 text-xs font-medium mb-1">IPFS CID:</p>
                    <p className="text-white font-mono text-xs break-all">
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-400"
                      >
                        {ipfsCid}
                      </a>
                    </p>
                  </div>
                )}
                {txHash && (
                  <div className="mt-4">
                    <p className="text-gray-400 text-xs font-medium mb-1">TRANSACTION HASH:</p>
                    <p className="text-white font-mono text-xs break-all">
                      <a
                        href={`https://primordial.bdagscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-400"
                      >
                        {txHash}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackToDashboard}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setUploaded(false);
                    setFile(null);
                    setVerification('');
                    setTxHash('');
                    setIpfsCid('');
                    setError('');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default UploadPage;