'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, CheckCircle, AlertCircle, Eye, ExternalLink, User } from 'lucide-react';
import { ethers } from 'ethers';

const MEDICAL_RECORDS_ADDRESS = ethers.getAddress('0x01A8f810F50a0aE8Eb5ad9928506e77bbC93B7A4');
const MEDICAL_RECORD_ACCESS_ADDRESS = ethers.getAddress('0x9e32f3956d862a733012f97d5e7cf5b1767b13d8');

const MEDICAL_RECORD_ACCESS_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'patient', type: 'address' },
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'string', name: 'ipfsCid', type: 'string' },
    ],
    name: 'hasAccess',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'grantee', type: 'address' },
      { internalType: 'address', name: 'patient', type: 'address' },
    ],
    name: 'getGranteeAccess',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'ipfsCid', type: 'string' },
          { internalType: 'uint256', name: 'expiration', type: 'uint256' },
          { internalType: 'uint256', name: 'grantTimestamp', type: 'uint256' },
        ],
        internalType: 'struct MedicalRecordAccess.AccessInfo[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

interface AccessInfo {
  ipfsCid: string;
  expiration: number;
  grantTimestamp: number;
}

export default function ReceivePage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [accessibleRecords, setAccessibleRecords] = useState<AccessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedWallet = sessionStorage.getItem('walletAddress');
    if (!storedWallet) {
      setError('No wallet connected. Please connect your wallet.');
      window.location.href = '/login';
      return;
    }

    try {
      const normalizedWallet = ethers.getAddress(storedWallet);
      setWalletAddress(normalizedWallet);
    } catch (err) {
      console.error('Invalid wallet address:', err);
      setError('Invalid wallet address. Please reconnect your wallet.');
      window.location.href = '/login';
      return;
    }
  }, []);

  const fetchAccessibleRecords = async () => {
    setLoading(true);
    setError('');
    setAccessibleRecords([]);

    try {
      if (!window.ethereum) {
        throw new Error('No Web3 wallet detected. Please install MetaMask.');
      }

      if (!ethers.isAddress(patientAddress)) {
        throw new Error('Invalid patient address. Please enter a valid Ethereum address.');
      }

      if (patientAddress.toLowerCase() === walletAddress.toLowerCase()) {
        throw new Error('Patient address cannot be the same as your wallet address.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getNetwork();
      const contract = new ethers.Contract(MEDICAL_RECORD_ACCESS_ADDRESS, MEDICAL_RECORD_ACCESS_ABI, provider);

      const result = await contract.getGranteeAccess(walletAddress, patientAddress);
      
      console.log('Raw result:', result);
      console.log('Result length:', result.length);

      // Convert Result object to plain JavaScript array/objects
      const accessInfos: AccessInfo[] = [];
      
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        console.log(`Processing item ${i}`);
        
        try {
          let ipfsCid = '';
          let expiration = 0;
          let grantTimestamp = 0;
          
          // The IPFS CID is stored as two bytes32 values at indices 1 and 2
          // Index 0 seems to cause an error, so we skip it
          
          // Get first part of IPFS CID from index 1
          try {
            const val1 = item[1];
            if (typeof val1 === 'bigint') {
              const hexVal = '0x' + val1.toString(16).padStart(64, '0');
              const bytes = ethers.getBytes(hexVal);
              const cleanBytes = bytes.filter(b => b !== 0);
              const part1 = ethers.toUtf8String(cleanBytes);
              ipfsCid += part1;
            }
          } catch (e) {
            console.error('Error decoding IPFS CID part 1:', e);
          }
          
          // Get second part of IPFS CID from index 2
          try {
            const val2 = item[2];
            if (typeof val2 === 'bigint') {
              const hexVal = '0x' + val2.toString(16).padStart(64, '0');
              const bytes = ethers.getBytes(hexVal);
              const cleanBytes = bytes.filter(b => b !== 0);
              const part2 = ethers.toUtf8String(cleanBytes);
              ipfsCid += part2;
            }
          } catch (e) {
            console.error('Error decoding IPFS CID part 2:', e);
          }
          
          // Try to get expiration and timestamp from index 3 and 4
          // or they might be elsewhere in the structure
          try {
            if (item.length > 3) {
              const val3 = item[3];
              expiration = typeof val3 === 'bigint' ? Number(val3) : 0;
            }
          } catch (e) {
            console.log('No expiration found');
          }
          
          try {
            if (item.length > 4) {
              const val4 = item[4];
              grantTimestamp = typeof val4 === 'bigint' ? Number(val4) : 0;
            }
          } catch (e) {
            console.log('No timestamp found');
          }
          
          console.log('Extracted values:', { ipfsCid, expiration, grantTimestamp });
          
          if (ipfsCid && ipfsCid.trim()) {
            const accessInfo: AccessInfo = {
              ipfsCid: ipfsCid.trim(),
              expiration,
              grantTimestamp,
            };
            accessInfos.push(accessInfo);
          }
        } catch (decodeError) {
          console.error(`Error decoding item ${i}:`, decodeError);
        }
      }

      console.log('Final decoded accessInfos:', accessInfos);

      if (accessInfos.length === 0) {
        setError('No accessible records found for this patient. Ensure access has been granted and not expired or revoked.');
      } else {
        const now = Math.floor(Date.now() / 1000);
        const validRecords = accessInfos.filter((info) => {
          return info.ipfsCid && (info.expiration === 0 || info.expiration > now);
        });
        
        if (validRecords.length === 0) {
          setError('All granted records have expired or been revoked.');
        } else {
          setAccessibleRecords(validRecords);
        }
      }
    } catch (error: any) {
      console.error('Error fetching accessible records:', error);
      let errorMessage = 'Failed to fetch accessible records. Please try again.';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user.';
      } else if (error.code === 'CALL_EXCEPTION') {
        errorMessage = error.reason || 'Contract call failed. Please check the patient address or contract deployment.';
      } else if (error.code === 'INVALID_ARGUMENT') {
        errorMessage = 'Invalid input parameters. Please check the patient address.';
      } else if (error.code === -32603) {
        errorMessage = error.reason || 'Internal blockchain error. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkIPFSAccess = async (cid: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

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
                <h1 className="text-white font-semibold text-xl">HealthSecure</h1>
                <p className="text-gray-400 text-xs">Powered by BlockDAG</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">Connected</p>
                <p className="text-gray-400 text-xs font-mono">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
                </p>
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
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto text-gray-400 hover:text-gray-300"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Receive Medical Records</h2>
          <p className="text-gray-400">
            Check and access medical records granted to you on the BlockDAG blockchain.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-white font-semibold text-lg mb-4">Check Access</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Patient Address</label>
              <input
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchAccessibleRecords}
              disabled={loading || !patientAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking Access...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Check Accessible Records
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold text-lg mb-4">Accessible Medical Records</h3>
          {accessibleRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No accessible records found</p>
              <p className="text-gray-500 text-sm mt-1">
                Enter a patient address to check for granted records
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {accessibleRecords.map((record, index) => (
                <motion.div
                  key={`${record.ipfsCid}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg border border-blue-500/50 bg-blue-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm">Medical Record from {patientAddress.slice(0, 6)}...{patientAddress.slice(-4)}</p>
                        <p className="text-gray-400 text-xs font-mono break-all">{record.ipfsCid}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Granted: {new Date(Number(record.grantTimestamp) * 1000).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {record.expiration === 0
                            ? 'No expiration'
                            : `Expires: ${new Date(Number(record.expiration) * 1000).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
                        onClick={async (e) => {
                          const isAccessible = await checkIPFSAccess(record.ipfsCid);
                          if (!isAccessible) {
                            e.preventDefault();
                            setError(`IPFS file at CID ${record.ipfsCid.slice(0, 8)}... is not accessible. Ensure it is pinned.`);
                          }
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}