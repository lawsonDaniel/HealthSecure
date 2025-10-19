'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Upload, Activity, Send, FileText, CheckCircle, Clock, User, AlertCircle, Eye, ExternalLink, Share2, Stethoscope, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

// Utility function for error handling
const handleError = (error: unknown, defaultMessage: string): string => {
  console.error(defaultMessage, error);
  if (error instanceof Error) {
    if (error.message.includes('user rejected')) return 'Action rejected by user. Please try again.';
    if (error.message.includes('network')) return 'Network issue detected. Please check your connection and try again.';
    if (error.message.includes('consent')) return error.message;
    if (error.message.includes('invalid address')) return 'Invalid wallet address detected. Please reconnect your wallet.';
    if (error.message.includes('No access to this record')) return 'You do not have access to this record. Please verify the record was uploaded correctly or request access from the patient.';
    return error.message || defaultMessage;
  }
  return defaultMessage;
};

// Utility to add timeout to async operations
const withTimeout = async <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeout]);
};

// Role Selection Modal Component
const RoleSelectionModal = ({ onRoleSelect, loading }: { onRoleSelect: (role: string) => void; loading: boolean }) => {
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
            className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30"
          >
            <User className="w-10 h-10 text-blue-500" />
          </motion.div>

          <h3 className="text-xl font-semibold text-white mb-2">Welcome to HealthSecure</h3>
          <p className="text-gray-300 text-sm mb-6">Please select your role to continue to the dashboard</p>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <button
              onClick={() => onRoleSelect('patient')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg transition-all font-medium flex items-center justify-center gap-3 group"
            >
              <User className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold">I am a Patient</p>
                <p className="text-blue-100 text-xs">Manage my medical records</p>
              </div>
            </button>

            <button
              onClick={() => onRoleSelect('doctor')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg transition-all font-medium flex items-center justify-center gap-3 group"
            >
              <Stethoscope className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold">I am a Doctor</p>
                <p className="text-green-100 text-xs">Access patient records</p>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Redirecting...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Activity Monitor Component
interface Activity {
  type: 'upload' | 'transfer';
  patient: string;
  timestamp: Date;
  ipfsCid: string;
  txHash: string;
  isCurrentUser: boolean;
  grantee?: string;
}

interface ActivityMonitorProps {
  walletAddress: string;
  recentActivities: Activity[];
  onNewActivity: (activity: Activity) => void;
  decryptionLoading: { [ipfsCid: string]: boolean };
  setDecryptionLoading: React.Dispatch<React.SetStateAction<{ [ipfsCid: string]: boolean }>>;
  decryptAndViewFile: (ipfsCid: string) => Promise<void>;
  hasAccessToRecord: (ipfsCid: string) => Promise<boolean>;
}

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({
  walletAddress,
  recentActivities,
  onNewActivity,
  decryptionLoading,
  setDecryptionLoading,
  decryptAndViewFile,
  hasAccessToRecord,
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const medicalRecordsAddr = ethers.getAddress('0x96081A4b38AcBbc4dAAbc72178AF8C2818DC9652');
  const medicalRecordsABI = [
    {
      inputs: [{ internalType: 'address', name: '_healthConsentAddress', type: 'address' }],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
        { indexed: true, internalType: 'address', name: 'authorized', type: 'address' },
        { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
      ],
      name: 'AccessGranted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
      ],
      name: 'RecordUploaded',
      type: 'event',
    },
    {
      inputs: [
        { internalType: 'address', name: '_authorized', type: 'address' },
        { internalType: 'string', name: '_ipfsCid', type: 'string' },
        { internalType: 'bytes', name: '_encryptedKeyShare', type: 'bytes' },
      ],
      name: 'grantAccess',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: '_ipfsCid', type: 'string' }],
      name: 'getKeyShare',
      outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: '_patient', type: 'address' }],
      name: 'getRecords',
      outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'healthConsent',
      outputs: [{ internalType: 'contract IHealthConsent', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'string', name: '_ipfsCid', type: 'string' },
        { internalType: 'bytes', name: '_selfEncryptedKeyShare', type: 'bytes' },
      ],
      name: 'uploadRecord',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  const startMonitoring = async () => {
    if (!window.ethereum) {
      setError('Ethereum provider not found. Please install MetaMask.');
      return;
    }

    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached for monitoring. Please check your setup.');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await withTimeout(provider.getNetwork(), 10000, 'Network connection timed out.');
      console.log('Connected to network:', network.chainId, network.name);

      if (Number(network.chainId) !== 1043) {
        setError('Wrong network. Please connect to BlockDAG (chain ID 1043).');
        return;
      }

      const medicalRecordsContract = new ethers.Contract(medicalRecordsAddr, medicalRecordsABI, provider);

      // Verify contract deployment
      const code = await provider.getCode(medicalRecordsAddr);
      if (code === '0x') {
        throw new Error('No contract found at MedicalRecords address.');
      }

      medicalRecordsContract.on('RecordUploaded', (patient, timestamp, ipfsCid, event) => {
        const newActivity = {
          type: 'upload' as const,
          patient,
          timestamp: new Date(Number(timestamp) * 1000),
          ipfsCid,
          txHash: event.transactionHash || event.log?.transactionHash || 'unknown',
          isCurrentUser: patient.toLowerCase() === walletAddress.toLowerCase(),
        };
        console.log('New file upload detected:', newActivity);
        onNewActivity(newActivity);
      });

      medicalRecordsContract.on('AccessGranted', (patient, authorized, ipfsCid, event) => {
        const newActivity = {
          type: 'transfer' as const,
          patient,
          grantee: authorized,
          ipfsCid,
          timestamp: new Date(),
          txHash: event.transactionHash || event.log?.transactionHash || 'unknown',
          isCurrentUser: patient.toLowerCase() === walletAddress.toLowerCase(),
        };
        console.log('New access granted detected:', newActivity);
        onNewActivity(newActivity);
      });

      setIsMonitoring(true);
      setRetryCount(0);
      console.log('Started monitoring activity events');
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to start event monitoring. Check network or contract addresses.');
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const medicalRecordsContract = new ethers.Contract(medicalRecordsAddr, medicalRecordsABI, provider);
      medicalRecordsContract.removeAllListeners('RecordUploaded');
      medicalRecordsContract.removeAllListeners('AccessGranted');
      setIsMonitoring(false);
      console.log('Stopped monitoring activity events');
    } catch (error) {
      console.error('Error stopping event monitoring:', error);
      setError(handleError(error, 'Failed to stop event monitoring.'));
    }
  };

  const fetchHistoricalActivities = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const medicalRecordsContract = new ethers.Contract(medicalRecordsAddr, medicalRecordsABI, provider);

      // Verify network
      const network = await withTimeout(provider.getNetwork(), 10000, 'Network connection timed out.');
      if (Number(network.chainId) !== 1043) {
        throw new Error('Wrong network. Please connect to BlockDAG (chain ID 1043).');
      }

      // Fetch user records
      const userRecords = await withTimeout(
        medicalRecordsContract.getRecords(walletAddress),
        10000,
        'Failed to fetch records: Request timed out.'
      );
      console.log('Fetched user records:', userRecords);

      const uploadActivities = userRecords.map((cid: string) => ({
        type: 'upload' as const,
        patient: walletAddress,
        timestamp: new Date(),
        ipfsCid: cid,
        txHash: 'Historical Record',
        isCurrentUser: true,
      }));

      // Fetch AccessGranted events
      const accessGrantedFilter = medicalRecordsContract.filters.AccessGranted(walletAddress, null, null);
      const accessGrantedEvents = await withTimeout(
        medicalRecordsContract.queryFilter(accessGrantedFilter),
        15000,
        'Failed to fetch access granted events: Request timed out.'
      );

      const accessGrantedActivities = accessGrantedEvents.map((event) => ({
        type: 'transfer' as const,
        patient: event.args.patient,
        grantee: event.args.authorized,
        ipfsCid: event.args.ipfsCid,
        timestamp: new Date(),
        txHash: event.transactionHash,
        isCurrentUser: event.args.patient.toLowerCase() === walletAddress.toLowerCase(),
      }));

      const allActivities = [...uploadActivities, ...accessGrantedActivities].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      allActivities.forEach((activity) => onNewActivity(activity));
      setRetryCount(0);
      console.log('Fetched historical activities:', allActivities);
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to fetch historical activities.');
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setRetryCount((prev) => prev + 1);
    startMonitoring();
    fetchHistoricalActivities();
  };

  useEffect(() => {
    if (walletAddress) {
      console.log('ActivityMonitor walletAddress:', walletAddress);
      startMonitoring();
      fetchHistoricalActivities();
    }

    return () => {
      stopMonitoring();
    };
  }, [walletAddress]);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Recent Blockchain Activity</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-400 text-sm">{isMonitoring ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{error}</p>
            {retryCount < maxRetries && (
              <button
                onClick={handleRetry}
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry ({maxRetries - retryCount} attempts left)
              </button>
            )}
            {error.includes('access to this record') && (
              <button
                onClick={() => (window.location.href = '/dashboard/upload')}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Re-upload Record
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading activity history...</p>
        </div>
      ) : recentActivities.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No blockchain activity detected yet</p>
          <p className="text-gray-500 text-sm mt-1">Upload or transfer medical records to see them here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={`${activity.txHash}-${activity.ipfsCid}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${
                activity.isCurrentUser ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-700 bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.isCurrentUser ? 'bg-blue-500/20' : 'bg-gray-600'
                    }`}
                  >
                    {activity.type === 'upload' && <FileText className="w-4 h-4 text-blue-400" />}
                    {activity.type === 'transfer' && <Share2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-white text-sm">
                      {activity.type === 'upload' &&
                        (activity.isCurrentUser
                          ? 'You uploaded a medical record'
                          : `${activity.patient.slice(0, 6)}...${activity.patient.slice(-4)} uploaded a medical record`)}
                      {activity.type === 'transfer' &&
                        (activity.isCurrentUser
                          ? `You granted access to ${activity.grantee?.slice(0, 6)}...${activity.grantee?.slice(-4)}`
                          : `${activity.patient.slice(0, 6)}...${activity.patient.slice(-4)} granted access to ${activity.grantee?.slice(0, 6)}...${activity.grantee?.slice(-4)}`)}
                    </p>
                    <p className="text-gray-400 text-xs">{activity.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                {activity.txHash !== 'Historical Record' && (
                  <a
                    href={`https://primordial.bdagscan.com/tx/${activity.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    TX
                  </a>
                )}
              </div>
              <div className="mt-2">
                <p className="text-gray-400 text-xs font-medium mb-1">IPFS CID:</p>
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 font-mono text-xs break-all flex-1 mr-2">{activity.ipfsCid}</p>
                  <button
                    onClick={async () => {
                      const hasAccess = await hasAccessToRecord(activity.ipfsCid);
                      if (hasAccess) {
                        await decryptAndViewFile(activity.ipfsCid);
                      } else {
                        setError('You do not have access to this record. Please verify the record was uploaded correctly or request access from the patient.');
                      }
                    }}
                    disabled={decryptionLoading[activity.ipfsCid]}
                    className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {decryptionLoading[activity.ipfsCid] ? (
                      <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    View Decrypted
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Activity Notifications Component
const ActivityNotifications = ({ activities }: { activities: Activity[] }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [latestActivity, setLatestActivity] = useState<Activity | null>(null);
  const [previousActivitiesCount, setPreviousActivitiesCount] = useState(0);

  useEffect(() => {
    if (activities.length > previousActivitiesCount) {
      const latest = activities[0];
      if (Date.now() - latest.timestamp.getTime() < 10000) {
        setLatestActivity(latest);
        setShowNotification(true);

        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
    setPreviousActivitiesCount(activities.length);
  }, [activities, previousActivitiesCount]);

  if (!showNotification || !latestActivity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-4 right-4 bg-gray-800 border border-green-500/50 rounded-lg p-4 shadow-lg z-50 max-w-sm"
    >
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <div>
          <p className="text-white font-medium text-sm">
            {latestActivity.type === 'upload' && 'New Medical Record Uploaded'}
            {latestActivity.type === 'transfer' && 'New Access Granted'}
          </p>
          <p className="text-gray-400 text-xs">
            {latestActivity.isCurrentUser ? 'Your action' : 'An action'} was recorded on BlockDAG
          </p>
          <p className="text-gray-500 text-xs mt-1">{latestActivity.timestamp.toLocaleTimeString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Consent Modal Component
const ConsentModal = ({ walletAddress, onSign, onClose, loading }: { walletAddress: string; onSign: (address: string) => void; onClose: () => void; loading: boolean }) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const consentSections = [
    {
      title: 'Data Usage Purpose',
      content:
        'Your healthcare data will be used for AI analysis and secure sharing with authorized medical providers to improve diagnosis and treatment outcomes.',
    },
    {
      title: 'Encryption & Security',
      content:
        'All data is encrypted end-to-end before storage on BlockDAG blockchain. Only authorized medical professionals with your permission can decrypt and access your information.',
    },
    {
      title: 'Your Rights & Control',
      content:
        'You maintain full control over your data. You can withdraw consent anytime, view access history, and request data deletion according to HIPAA regulations.',
    },
    {
      title: 'Smart Contract Terms',
      content:
        'This consent is recorded as an immutable smart contract on BlockDAG network, providing transparent audit trails and ensuring compliance with healthcare regulations.',
    },
  ];

  const handleSectionView = (index: number) => {
    if (index <= readingProgress + 1) {
      setReadingProgress(index);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700"
      >
        <div className="p-6 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-white">Healthcare Data Sharing Consent</h2>
              <p className="text-gray-400 text-sm mt-1">Required to continue with secure data transfer</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="flex gap-2 mb-6">
            {consentSections.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded transition-all duration-300 ${
                  index <= readingProgress ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="space-y-4 mb-6">
            {consentSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSectionView(index)}
                className={`bg-gray-800 p-4 rounded-lg border cursor-pointer transition-all hover:border-gray-600 ${
                  index <= readingProgress ? 'border-blue-500/50' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index <= readingProgress ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2">{section.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-start gap-3 mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-300 text-sm leading-relaxed">
              I have read and understood all sections of this consent agreement. I voluntarily agree to share my
              healthcare data according to the terms above and understand this consent will be permanently recorded on the
              BlockDAG blockchain.
            </span>
          </motion.label>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800/30">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSign(walletAddress)}
              disabled={!agreed || readingProgress < consentSections.length - 1 || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign Consent on BlockDAG
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Consent Success Component
const ConsentSuccess = ({ txHash, contractAddress, blockNumber, onContinue }: { txHash: string; contractAddress: string; blockNumber: string; onContinue: () => void }) => {
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

          <h3 className="text-xl font-semibold text-white mb-2">Consent Signed Successfully!</h3>
          <p className="text-gray-300 text-sm mb-6">
            Your healthcare data sharing consent has been securely recorded on the BlockDAG blockchain.
          </p>

          <div className="bg-gray-800 p-4 rounded-lg mb-4 text-left space-y-3">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">STATUS:</p>
              <p className="text-green-400 text-sm font-medium">✓ Transaction mined and executed</p>
            </div>
            {txHash && (
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">TRANSACTION HASH:</p>
                <p className="text-white font-mono text-xs break-all">{txHash}</p>
              </div>
            )}
            {contractAddress && (
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">CONTRACT ADDRESS:</p>
                <p className="text-white font-mono text-xs break-all">{contractAddress}</p>
              </div>
            )}
            {blockNumber && (
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">BLOCK NUMBER:</p>
                <p className="text-white font-mono text-sm">{blockNumber}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">TIMESTAMP:</p>
              <p className="text-gray-300 text-xs">{new Date().toLocaleString()}</p>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Continue to Upload Medical Records
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [consentTxHash, setConsentTxHash] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [blockNumber, setBlockNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);
  const [error, setError] = useState('');
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [decryptionLoading, setDecryptionLoading] = useState<{ [ipfsCid: string]: boolean }>({});
  const maxRetries = 3;

  const healthConsentAddr = ethers.getAddress('0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157');
  const medicalRecordsAddr = ethers.getAddress('0x96081A4b38AcBbc4dAAbc72178AF8C2818DC9652');
  const healthConsentABI = [
    {
      inputs: [{ internalType: 'address', name: '_patient', type: 'address' }],
      name: 'getConsent',
      outputs: [
        { internalType: 'bool', name: '', type: 'bool' },
        { internalType: 'uint256', name: '', type: 'uint256' },
        { internalType: 'string', name: '', type: 'string' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        { indexed: false, internalType: 'string', name: 'consentHash', type: 'string' },
      ],
      name: 'ConsentSigned',
      type: 'event',
    },
    {
      inputs: [
        { internalType: 'address', name: '_patient', type: 'address' },
        { internalType: 'string', name: '_consentHash', type: 'string' },
      ],
      name: 'signConsent',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];
  const medicalRecordsABI = [
    {
      inputs: [{ internalType: 'address', name: '_healthConsentAddress', type: 'address' }],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
        { indexed: true, internalType: 'address', name: 'authorized', type: 'address' },
        { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
      ],
      name: 'AccessGranted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
      ],
      name: 'RecordUploaded',
      type: 'event',
    },
    {
      inputs: [
        { internalType: 'address', name: '_authorized', type: 'address' },
        { internalType: 'string', name: '_ipfsCid', type: 'string' },
        { internalType: 'bytes', name: '_encryptedKeyShare', type: 'bytes' },
      ],
      name: 'grantAccess',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: '_ipfsCid', type: 'string' }],
      name: 'getKeyShare',
      outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: '_patient', type: 'address' }],
      name: 'getRecords',
      outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'healthConsent',
      outputs: [{ internalType: 'contract IHealthConsent', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'string', name: '_ipfsCid', type: 'string' },
        { internalType: 'bytes', name: '_selfEncryptedKeyShare', type: 'bytes' },
      ],
      name: 'uploadRecord',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

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

  const hasAccessToRecord = async (ipfsCid: string): Promise<boolean> => {
    if (!window.ethereum) {
      setError('No Web3 wallet detected. Please install MetaMask.');
      return false;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(medicalRecordsAddr, medicalRecordsABI, provider);

      // Verify network
      const network = await withTimeout(provider.getNetwork(), 10000, 'Network connection timed out.');
      if (Number(network.chainId) !== 1043) {
        setError('Wrong network. Please connect to BlockDAG (chain ID 1043).');
        return false;
      }

      // Check if user is patient
      const userRecords = await withTimeout(
        contract.getRecords(walletAddress),
        10000,
        'Failed to fetch records: Request timed out.'
      );
      console.log('User records for', walletAddress, ':', userRecords);
      if (userRecords.includes(ipfsCid)) {
        console.log('Access confirmed: User is the patient for CID', ipfsCid);
        return true;
      }

      // Check if user is authorized
      const accessGrantedFilter = contract.filters.AccessGranted(null, walletAddress, ipfsCid);
      const accessGrantedEvents = await withTimeout(
        contract.queryFilter(accessGrantedFilter),
        15000,
        'Failed to fetch access granted events: Request timed out.'
      );
      if (accessGrantedEvents.length > 0) {
        console.log('Access confirmed: User is authorized for CID', ipfsCid);
        return true;
      }

      // Check consent status
      const consentContract = new ethers.Contract(healthConsentAddr, healthConsentABI, provider);
      const [hasSigned] = await withTimeout(
        consentContract.getConsent(walletAddress),
        10000,
        'Consent check timed out.'
      );
      if (!hasSigned) {
        setError('Consent not signed. Please sign consent agreement on the dashboard.');
        return false;
      }

      setError('Record not found. Please verify the record was uploaded correctly or request access from the patient.');
      return false;
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to check record access.');
      setError(errorMessage);
      return false;
    }
  };


const decryptAndViewFile = async (ipfsCid: string) => {
  setDecryptionLoading((prev) => ({ ...prev, [ipfsCid]: true }));
  setError('');

  try {
    if (!window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask.');
    }

    console.log('Starting decryption for CID:', ipfsCid);

    // Validate CID format
    if (!ipfsCid || typeof ipfsCid !== 'string' || ipfsCid.length < 10) {
      throw new Error('Invalid IPFS CID format. Please check the file identifier.');
    }

    // Get the stored timestamp and wallet address from session storage
    const storedTimestamp = sessionStorage.getItem(`uploadTimestamp_${ipfsCid}`);
    const storedWallet = sessionStorage.getItem(`walletAddress_${ipfsCid}`);
    
    // Fallback to key material if direct storage items not found
    if (!storedTimestamp || !storedWallet) {
      console.log('Timestamp or wallet not found in direct storage, checking key material...');
      const storedKeyMaterial = sessionStorage.getItem(`encryptionKey_${ipfsCid}`);
      if (storedKeyMaterial) {
        const keyMaterial = JSON.parse(storedKeyMaterial);
        if (keyMaterial.timestamp) {
          sessionStorage.setItem(`uploadTimestamp_${ipfsCid}`, keyMaterial.timestamp.toString());
          sessionStorage.setItem(`walletAddress_${ipfsCid}`, keyMaterial.walletAddress || walletAddress);
          console.log('Recovered timestamp and wallet from key material');
        } else {
          throw new Error('No timestamp found for this file. Please ensure you are using the same wallet that uploaded the file.');
        }
      } else {
        throw new Error('No encryption key found for this file. Please ensure you are using the same wallet that uploaded the file and that you have not cleared your browser storage.');
      }
    }

    const timestamp = parseInt(storedTimestamp!);
    const fileWalletAddress = storedWallet || walletAddress;
    
    if (isNaN(timestamp)) {
      throw new Error('Invalid timestamp format. Cannot derive encryption key.');
    }

    console.log('Using timestamp for key derivation:', timestamp);
    console.log('Using wallet address for key derivation:', fileWalletAddress);
    
    // Regenerate the encryption key using the same wallet and timestamp
    console.log('Generating encryption key...');
    const key = await deriveEncryptionKey(timestamp, fileWalletAddress);
    console.log('Key derived successfully, length:', key.length, 'bytes');
    
    // Fetch encrypted file from IPFS with multiple gateway fallbacks
    console.log('Fetching encrypted file from IPFS...');
    
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
      `https://ipfs.io/ipfs/${ipfsCid}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsCid}`,
      `https://dweb.link/ipfs/${ipfsCid}`,
      `https://${ipfsCid}.ipfs.dweb.link/`,
      `https://${ipfsCid}.ipfs.cf-ipfs.com/`
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;
    let successfulGateway = '';

    // Try each gateway until one works
    for (const gatewayUrl of gateways) {
      try {
        console.log(`Trying gateway: ${gatewayUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        response = await fetch(gatewayUrl, {
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'application/octet-stream, */*',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          successfulGateway = gatewayUrl;
          console.log(`Successfully fetched from: ${gatewayUrl}`);
          break;
        } else {
          console.warn(`Gateway returned status ${response.status} for ${gatewayUrl}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.warn(`Failed to fetch from ${gatewayUrl}:`, err);
        lastError = err as Error;
        continue;
      }
    }

    if (!response || !response.ok) {
      const errorMsg = lastError?.message || 'Unknown error';
      throw new Error(
        `Failed to fetch file from all IPFS gateways. ` +
        `This could mean the file was not uploaded successfully, ` +
        `the CID is incorrect, or there are network connectivity issues. ` +
        `Last error: ${errorMsg}`
      );
    }

    console.log(`File fetched successfully from: ${successfulGateway}`);
    
    // Get the encrypted file data
    const encryptedData = await response.arrayBuffer();
    const encryptedBuffer = new Uint8Array(encryptedData);
    
    console.log('Encrypted file size:', encryptedBuffer.length, 'bytes');
    
    // Verify the file has minimum required size (IV + at least some content)
    if (encryptedBuffer.length < 17) {
      throw new Error('File too small to contain valid encrypted data (must include 16-byte IV and encrypted content).');
    }
    
    // Extract IV (first 16 bytes) and encrypted content
    const iv = encryptedBuffer.slice(0, 16);
    const encryptedContent = encryptedBuffer.slice(16);
    
    console.log('IV length:', iv.length, 'bytes');
    console.log('Encrypted content length:', encryptedContent.length, 'bytes');
    console.log('Key length for decryption:', key.length, 'bytes');
    
    // Verify IV is correct size for AES-CBC
    if (iv.length !== 16) {
      throw new Error('Invalid IV size. Expected 16 bytes for AES-CBC encryption.');
    }
    
    // Import key for decryption
    console.log('Importing key for decryption...');
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { 
        name: 'AES-CBC',
        length: 256
      },
      false,
      ['decrypt']
    );
    
    console.log('Key imported successfully, starting decryption...');
    
    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      cryptoKey,
      encryptedContent
    );
    
    console.log('Decryption successful, decrypted size:', decryptedBuffer.byteLength, 'bytes');
    
    // Verify decrypted content is not empty
    if (decryptedBuffer.byteLength === 0) {
      throw new Error('Decryption resulted in empty file. Possible key mismatch or corrupted data.');
    }
    
    // Get the original file information from session storage
    const originalFileName = sessionStorage.getItem(`originalFileName_${ipfsCid}`);
    const originalFileType = sessionStorage.getItem(`originalFileType_${ipfsCid}`);
    
    let fileType: string;
    let fileExtension: string;
    
    if (originalFileType) {
      // Use stored file type if available
      fileType = originalFileType;
      fileExtension = getFileExtensionFromMimeType(originalFileType);
    } else {
      // Detect file type from decrypted content
      fileType = detectFileTypeFromContent(new Uint8Array(decryptedBuffer));
      fileExtension = getFileExtensionFromMimeType(fileType);
    }
    
    // Create appropriate filename
    let fileName: string;
    if (originalFileName) {
      // Use original filename but ensure correct extension
      const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
      fileName = `${nameWithoutExt}.${fileExtension}`;
    } else {
      // Generate filename with correct extension
      fileName = `decrypted_record_${ipfsCid.slice(0, 8)}.${fileExtension}`;
    }
    
    console.log('File type detected:', fileType, 'Filename:', fileName);
    
    // Create and download the file
    const blob = new Blob([decryptedBuffer], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log(`Successfully decrypted and downloaded file: ${fileName} for CID: ${ipfsCid}`);
    
    // Optional: Show success message to user
    setError(''); // Clear any previous errors
    // You could add a success state here if needed
    
  } catch (error) {
    console.error('Decryption error details:', error);
    const errorMessage = handleError(error, 'Failed to decrypt and view file.');
    setError(errorMessage);
    
    // Log additional debug info
    console.debug('Debug info:', {
      ipfsCid,
      walletAddress,
      hasEthereum: !!window.ethereum,
      sessionStorageKeys: Object.keys(sessionStorage).filter(key => key.includes(ipfsCid))
    });
  } finally {
    setDecryptionLoading((prev) => ({ ...prev, [ipfsCid]: false }));
  }
};

// Helper functions for file type detection
const getFileExtensionFromMimeType = (mimeType: string): string => {
  const extensionMap: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/html': 'html',
    'application/json': 'json',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  };
  
  return extensionMap[mimeType] || 'bin'; // default to binary if unknown
};

const detectFileTypeFromContent = (content: Uint8Array): string => {
  // Check for PDF signature (%PDF)
  if (content.length >= 4 && 
      content[0] === 0x25 && // %
      content[1] === 0x50 && // P
      content[2] === 0x44 && // D
      content[3] === 0x46) { // F
    return 'application/pdf';
  }
  
  // Check for PNG signature
  if (content.length >= 8 &&
      content[0] === 0x89 && 
      content[1] === 0x50 && 
      content[2] === 0x4E && 
      content[3] === 0x47 &&
      content[4] === 0x0D &&
      content[5] === 0x0A &&
      content[6] === 0x1A &&
      content[7] === 0x0A) {
    return 'image/png';
  }
  
  // Check for JPEG signature
  if (content.length >= 3 &&
      content[0] === 0xFF &&
      content[1] === 0xD8 &&
      content[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // Check for JSON (starts with { or [)
  if (content.length >= 1 && 
      (content[0] === 0x7B || content[0] === 0x5B)) { // { or [
    try {
      const text = new TextDecoder().decode(content);
      JSON.parse(text);
      return 'application/json';
    } catch {
      // Not valid JSON, continue
    }
  }
  
  // Check if content is primarily text (UTF-8)
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(content);
    // If it decodes without error and has reasonable text content
    if (text.length > 0) {
      // Additional check for common text patterns
      const textRatio = text.split('').filter(char => 
        char.match(/[a-zA-Z0-9\s.,!?;:'"()-]/)).length / text.length;
      if (textRatio > 0.7) {
        return 'text/plain';
      }
    }
  } catch {
    // Not valid UTF-8 text, likely binary
  }
  
  // Default to binary data
  return 'application/octet-stream';
};

// Enhanced error handler
const handleError = (error: any, defaultMessage: string): string => {
  console.error('Error details:', error);
  
  if (error.message.includes('Failed to fetch')) {
    return 'Network error: Unable to fetch file from IPFS. Please check your internet connection and try again. If the problem persists, the file may not be available on IPFS.';
  }
  
  if (error.message.includes('consent')) {
    return error.message;
  }
  
  if (error.message.includes('wallet')) {
    return error.message;
  }
  
  if (error.message.includes('timestamp') || error.message.includes('encryption key')) {
    return error.message;
  }
  
  if (error.message.includes('IV') || error.message.includes('decryption')) {
    return 'Decryption failed. The encryption key may be incorrect or the file may be corrupted. Please ensure you are using the same wallet that uploaded the file.';
  }
  
  if (error.message.includes('AbortError') || error.message.includes('timeout')) {
    return 'Request timeout. Please check your internet connection and try again.';
  }
  
  if (error.message.includes('HTTP 4') || error.message.includes('HTTP 5')) {
    return `Server error: ${error.message}. Please try again later.`;
  }
  
  return error.message || defaultMessage;
};

  const handleNewActivity = useCallback(
    (newActivity: Activity) => {
      setRecentActivities((prev) => {
        const exists = prev.some(
          (activity) =>
            activity.txHash === newActivity.txHash &&
            activity.ipfsCid === newActivity.ipfsCid &&
            activity.type === newActivity.type
        );
        if (!exists) {
          // For upload activities by current user, ensure we have the timestamp
          if (newActivity.type === 'upload' && newActivity.isCurrentUser) {
            const storedTimestamp = sessionStorage.getItem(`uploadTimestamp_${newActivity.ipfsCid}`);
            if (!storedTimestamp) {
              // If no timestamp stored, use current time as fallback
              sessionStorage.setItem(`uploadTimestamp_${newActivity.ipfsCid}`, Date.now().toString());
            }
          }
          return [newActivity, ...prev.slice(0, 19)];
        }
        return prev;
      });
    },
    []
  );

  const userUploadsCount = useMemo(
    () => recentActivities.filter((activity) => activity.type === 'upload' && activity.isCurrentUser).length,
    [recentActivities]
  );

  const checkConsentStatus = async (normalizedWallet: string, storedConsent: string | null) => {
    if (typeof window.ethereum === 'undefined') {
      setError('No Web3 wallet detected. Please install MetaMask.');
      if (storedConsent !== 'true') {
        setTimeout(() => setShowConsentModal(true), 1000);
      }
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(healthConsentAddr, healthConsentABI, provider);

      const [hasSigned] = await withTimeout(
        contract.getConsent(normalizedWallet),
        10000,
        'Consent check timed out. Please try again.'
      );

      if (hasSigned) {
        setConsentSigned(true);
        sessionStorage.setItem('consentSigned', 'true');
        const storedTxHash = sessionStorage.getItem('consentTxHash');
        const storedContract = sessionStorage.getItem('contractAddress');
        const storedBlock = sessionStorage.getItem('blockNumber');
        if (storedTxHash) setConsentTxHash(storedTxHash);
        if (storedContract) setContractAddress(storedContract);
        if (storedBlock) setBlockNumber(storedBlock);
      } else if (storedConsent !== 'true') {
        setTimeout(() => setShowConsentModal(true), 1000);
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to check consent status.');
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const checkUserRoleAndConsent = async () => {
      const storedWallet = sessionStorage.getItem('walletAddress');
      const storedRole = sessionStorage.getItem('userRole');
      const storedConsent = sessionStorage.getItem('consentSigned');

      if (!storedWallet) {
        setError('No wallet connected. Please connect your wallet.');
        setTimeout(() => (window.location.href = '/login'), 2000);
        return;
      }

      let normalizedWallet;
      try {
        normalizedWallet = ethers.getAddress(storedWallet);
        setWalletAddress(normalizedWallet);
      } catch (err) {
        const errorMessage = handleError(err, 'Invalid wallet address in sessionStorage.');
        setError(errorMessage);
        setTimeout(() => (window.location.href = '/login'), 2000);
        return;
      }

      if (storedRole) {
        setUserRole(storedRole);
        if (storedRole === 'patient') {
          await checkConsentStatus(normalizedWallet, storedConsent);
        } else {
          window.location.href = '/dashboard/receive';
        }
      } else {
        setTimeout(() => setShowRoleModal(true), 500);
      }
    };

    checkUserRoleAndConsent();
  }, []);

  const handleRoleSelect = (role: string) => {
    setLoading(true);
    setUserRole(role);
    sessionStorage.setItem('userRole', role);

    setTimeout(() => {
      setShowRoleModal(false);
      setLoading(false);
      if (role === 'doctor') {
        window.location.href = '/dashboard/receive';
      }
    }, 1000);
  };

  const signConsentOnBlockDAG = async (address: string) => {
    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached for consent signing. Please check your setup.');
      return { success: false, error: 'Maximum retry attempts reached.' };
    }

    setLoading(true);
    setError('');

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Web3 wallet detected. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const connectedAddress = await signer.getAddress();
      const normalizedAddress = ethers.getAddress(connectedAddress);
      if (normalizedAddress.toLowerCase() !== ethers.getAddress(address).toLowerCase()) {
        throw new Error('Wallet address mismatch. Please reconnect your wallet.');
      }

      const contract = new ethers.Contract(healthConsentAddr, healthConsentABI, signer);

      const consentData = {
        patient: normalizedAddress,
        timestamp: new Date().toISOString(),
        sections: ['data_usage', 'encryption', 'rights', 'smart_contract'],
        version: '1.0',
        nonce: Math.random().toString(36).substring(2),
      };
      const consentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(consentData)));

      if (!ethers.isAddress(normalizedAddress)) {
        throw new Error('Invalid patient address');
      }
      if (!consentHash || !consentHash.startsWith('0x') || consentHash.length !== 66) {
        throw new Error('Invalid consent hash');
      }

      const [hasSigned] = await withTimeout(
        contract.getConsent(normalizedAddress),
        10000,
        'Consent check timed out.'
      );
      if (hasSigned) {
        setLoading(false);
        setError('Consent already signed for this wallet.');
        return { success: false, error: 'Consent already signed for this wallet.' };
      }

      const gasEstimate = await withTimeout(
        contract.signConsent.estimateGas(normalizedAddress, consentHash, { from: normalizedAddress }),
        10000,
        'Gas estimation timed out.'
      );
      const gasLimit = (gasEstimate * 120n) / 100n;

      const tx = await withTimeout(
        contract.signConsent(normalizedAddress, consentHash, { gasLimit }),
        60000,
        'Transaction timed out.'
      );
      const receipt = await withTimeout(tx.wait(), 120000, 'Transaction confirmation timed out.');
      if (receipt.status !== 1) {
        throw new Error('Transaction failed with status 0');
      }

      setLoading(false);
      setConsentSigned(true);
      sessionStorage.setItem('consentSigned', 'true');
      sessionStorage.setItem('consentTxHash', receipt.hash);
      sessionStorage.setItem('contractAddress', healthConsentAddr);
      sessionStorage.setItem('blockNumber', receipt.blockNumber.toString());
      sessionStorage.setItem('consentTimestamp', new Date().toISOString());

      return {
        success: true,
        txHash: receipt.hash,
        contractAddress: healthConsentAddr,
        blockNumber: receipt.blockNumber.toString(),
      };
    } catch (error) {
      setLoading(false);
      const errorMessage = handleError(error, 'Failed to sign consent on blockchain.');
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
      return { success: false, error: errorMessage };
    }
  };

  const handleSignConsent = async (address: string) => {
    const result = await signConsentOnBlockDAG(address);

    if (result.success) {
      setConsentTxHash(result.txHash);
      setContractAddress(result.contractAddress);
      setBlockNumber(result.blockNumber);
      setConsentSigned(true);
      setShowConsentModal(false);
      setShowSuccess(true);
    } else {
      setError(result.error);
    }
  };

  const handleContinueToUpload = () => {
    setShowSuccess(false);
    window.location.href = '/dashboard/upload';
  };

  const handleDisconnect = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const handleRetryConsent = () => {
    setError('');
    setRetryCount((prev) => prev + 1);
    handleSignConsent(walletAddress);
  };

  const StatsCard = ({ icon: Icon, title, value, status, color }: { icon: any; title: string; value: string; status: string; color: string }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            status === 'completed' ? 'bg-green-500/20 text-green-400' :
            status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
            status === 'active' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}
        >
          {status}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-xl font-semibold">{value}</p>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, action, disabled = false }: { icon: any; title: string; description: string; action: () => void; disabled?: boolean }) => (
    <button
      onClick={action}
      disabled={disabled}
      className="bg-gray-800 hover:bg-gray-750 disabled:bg-gray-800/50 disabled:cursor-not-allowed rounded-xl p-5 text-left border border-gray-700 hover:border-gray-600 transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${disabled ? 'bg-gray-600' : 'bg-blue-500 group-hover:bg-blue-600'} transition-colors`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-medium">{title}</span>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </button>
  );

  if (userRole === 'doctor') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Redirecting to Doctor Dashboard...</p>
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
                <h1 className="text-white font-semibold text-xl">HealthSecure</h1>
                <p className="text-gray-400 text-xs">Powered by BlockDAG</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">Connected as Patient</p>
                <p className="text-gray-400 text-xs font-mono">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
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
              {error.includes('consent') && !consentSigned && (
                <button
                  onClick={() => setShowConsentModal(true)}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Sign Consent Now
                </button>
              )}
              {error.includes('access to this record') && userRole === 'doctor' && (
                <button
                  onClick={() => (window.location.href = '/dashboard/transfer')}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Request Access
                </button>
              )}
              {error.includes('access to this record') && userRole === 'patient' && (
                <button
                  onClick={() => (window.location.href = '/dashboard/upload')}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Re-upload Record
                </button>
              )}
              {retryCount < maxRetries && !error.includes('consent') && !error.includes('access to this record') && (
                <button
                  onClick={handleRetryConsent}
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry ({maxRetries - retryCount} attempts left)
                </button>
              )}
            </div>
            <button onClick={() => setError('')} className="ml-auto text-gray-400 hover:text-gray-300">
              <AlertCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to HealthSecure</h2>
          <p className="text-gray-400">
            Securely manage and transfer your healthcare data using BlockDAG blockchain technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            icon={User} 
            title="Wallet Status" 
            value="Connected" 
            status="active" 
            color="bg-green-500" 
          />
          <StatsCard
            icon={Shield}
            title="Consent Status"
            value={consentSigned ? 'Signed' : 'Pending'}
            status={consentSigned ? 'completed' : 'pending'}
            color={consentSigned ? 'bg-green-500' : 'bg-yellow-500'}
          />
          <StatsCard
            icon={FileText}
            title="Files Uploaded"
            value={userUploadsCount.toString()}
            status={userUploadsCount > 0 ? 'active' : 'pending'}
            color={userUploadsCount > 0 ? 'bg-blue-500' : 'bg-gray-500'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickAction
            icon={Shield}
            title="Sign Consent Agreement"
            description="Authorize secure data sharing on BlockDAG blockchain"
            action={() => setShowConsentModal(true)}
            disabled={consentSigned}
          />
          <QuickAction
            icon={Upload}
            title="Upload Medical Records"
            description="Securely upload and encrypt your healthcare documents"
            action={() => (window.location.href = '/dashboard/upload')}
            disabled={!consentSigned}
          />
          <QuickAction
            icon={Activity}
            title="AI Health Analysis"
            description="Get AI-powered insights from your medical data"
            action={() => (window.location.href = '/dashboard/analyze')}
            disabled={!consentSigned}
          />
          <QuickAction
            icon={Send}
            title="Transfer Records"
            description="Share encrypted data with healthcare providers"
            action={() => (window.location.href = '/dashboard/transfer')}
            disabled={!consentSigned}
          />
          <QuickAction
            icon={FileText}
            title="View Consent History"
            description="Check your signed agreements and access logs"
            action={() => (window.location.href = '/dashboard/history')}
          />
          <QuickAction
            icon={User}
            title="Profile Settings"
            description="Manage your account and privacy preferences"
            action={() => (window.location.href = '/profile')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold text-lg mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Wallet Connected</p>
                    <p className="text-gray-400 text-xs">{new Date().toLocaleString()}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              {consentSigned ? (
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm">Consent Agreement Signed</p>
                      <p className="text-gray-400 text-xs">BlockDAG Network</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm">Consent Agreement Pending</p>
                      <p className="text-gray-400 text-xs">Required for data transfer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConsentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Sign Now
                  </button>
                </div>
              )}

              {recentActivities
                .filter((activity) => activity.isCurrentUser)
                .slice(0, 5)
                .map((activity, index) => (
                  <div
                    key={`activity-${activity.txHash}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        {activity.type === 'upload' && <FileText className="w-4 h-4 text-blue-400" />}
                        {activity.type === 'transfer' && <Share2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          {activity.type === 'upload' && 'Medical Record Uploaded'}
                          {activity.type === 'transfer' &&
                            `Access Granted to ${activity.grantee?.slice(0, 6)}...${activity.grantee?.slice(-4)}`}
                        </p>
                        <p className="text-gray-400 text-xs">{activity.timestamp.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs font-mono">
                          CID: {activity.ipfsCid.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.txHash !== 'Historical Record' && (
                        <a
                          href={`https://primordial.bdagscan.com/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          TX
                        </a>
                      )}
                      <button
                        onClick={async () => {
                          const hasAccess = await hasAccessToRecord(activity.ipfsCid);
                          if (hasAccess) {
                            await decryptAndViewFile(activity.ipfsCid);
                          } else {
                            setError('You do not have access to this record. Please verify the record was uploaded correctly or request access from the patient.');
                          }
                        }}
                        disabled={decryptionLoading[activity.ipfsCid]}
                        className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {decryptionLoading[activity.ipfsCid] ? (
                          <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        View Decrypted
                      </button>
                    </div>
                  </div>
                ))}

              {userUploadsCount === 0 && consentSigned && (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No files uploaded yet</p>
                  <button
                    onClick={() => (window.location.href = '/dashboard/upload')}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-1"
                  >
                    Upload your first record
                  </button>
                </div>
              )}
            </div>
          </div>

          <ActivityMonitor
            walletAddress={walletAddress}
            recentActivities={recentActivities}
            onNewActivity={handleNewActivity}
            decryptionLoading={decryptionLoading}
            setDecryptionLoading={setDecryptionLoading}
            decryptAndViewFile={decryptAndViewFile}
            hasAccessToRecord={hasAccessToRecord}
          />
        </div>
      </main>

      <AnimatePresence>
        {showRoleModal && (
          <RoleSelectionModal
            onRoleSelect={handleRoleSelect}
            loading={loading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConsentModal && (
          <ConsentModal
            walletAddress={walletAddress}
            onSign={handleSignConsent}
            onClose={() => setShowConsentModal(false)}
            loading={loading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <ConsentSuccess
            txHash={consentTxHash}
            contractAddress={contractAddress}
            blockNumber={blockNumber}
            onContinue={handleContinueToUpload}
          />
        )}
      </AnimatePresence>

      <ActivityNotifications activities={recentActivities} />
    </div>
  );
}