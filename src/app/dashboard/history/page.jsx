'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Clock, CheckCircle, AlertCircle, ExternalLink, User, Search, Filter, Download, Eye } from 'lucide-react';
import { ethers } from 'ethers';

const ConsentHistoryPage = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [consentHistory, setConsentHistory] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const initializePage = async () => {
      const storedWallet = sessionStorage.getItem('walletAddress');
      if (!storedWallet) {
        setError('No wallet connected. Please connect your wallet.');
        window.location.href = '/login';
        return;
      }

      try {
        const normalizedWallet = ethers.getAddress(storedWallet);
        setWalletAddress(normalizedWallet);
        await loadConsentHistory(normalizedWallet);
        await loadAccessLogs(normalizedWallet);
      } catch (err) {
        console.error('Error initializing page:', err);
        setError('Invalid wallet address or network error. Please reconnect your wallet and ensure you are on the BlockDAG testnet (Chain ID: 1043).');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const loadConsentHistory = async (address) => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Ethereum provider not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1043n) {
        throw new Error('Wrong network. Please switch to BlockDAG testnet (Chain ID: 1043).');
      }

      const contractABI = [
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
            { indexed: false, internalType: 'string', name: 'consentHash', type: 'string' },
            { indexed: false, internalType: 'string', name: 'version', type: 'string' },
            { indexed: false, internalType: 'string', name: 'ipfsCID', type: 'string' },
          ],
          name: 'ConsentSigned',
          type: 'event',
        },
      ];

      const contractAddr = ethers.getAddress('0x3fcb10a808Cb6F90DD7027Ac765Eeb75Bd5f6157');
      const contract = new ethers.Contract(contractAddr, contractABI, provider);

      const filter = contract.filters.ConsentSigned(address);
      const events = await contract.queryFilter(filter);

      const formattedHistory = await Promise.all(
        events.map(async (event, index) => {
          const block = await provider.getBlock(event.blockNumber);
          return {
            id: index,
            timestamp: new Date(Number(event.args.timestamp) * 1000), // Use event timestamp if accurate; fallback to block.timestamp if needed
            consentHash: event.args.consentHash,
            version: event.args.version || '1.0', // Fallback if not in event
            ipfsCID: event.args.ipfsCID || 'N/A', // Fallback if not in event
            isActive: true, // Assume active; no revoke event in ABI
            type: 'consent',
            status: 'active',
          };
        })
      );

      setConsentHistory(formattedHistory.sort((a, b) => b.timestamp - a.timestamp)); // Sort latest first

    } catch (error) {
      console.error('Error loading consent history:', error);
      setConsentHistory([]);
      setError('Failed to load consent history. Check console for details or ensure correct network.');
    }
  };

  const loadAccessLogs = async (address) => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Ethereum provider not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1043n) {
        throw new Error('Wrong network. Please switch to BlockDAG testnet (Chain ID: 1043).');
      }

      const contractABI = [ // Full ABI pasted here to fix TypeError
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
            { indexed: false, internalType: 'string', name: 'consentHash', type: 'string' },
            { indexed: false, internalType: 'string', name: 'version', type: 'string' },
            { indexed: false, internalType: 'string', name: 'ipfsCID', type: 'string' },
          ],
          name: 'ConsentSigned',
          type: 'event',
        },
        {
          inputs: [{ internalType: 'address', name: '_patient', type: 'address' }],
          name: 'getConsentHistory',
          outputs: [
            {
              components: [
                { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
                { internalType: 'string', name: 'consentHash', type: 'string' },
                { internalType: 'string', name: 'version', type: 'string' },
                { internalType: 'string', name: 'ipfsCID', type: 'string' },
                { internalType: 'bool', name: 'isActive', type: 'bool' },
              ],
              internalType: 'struct ConsentManager.ConsentRecord[]',
              name: '',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [{ internalType: 'address', name: '_patient', type: 'address' }],
          name: 'getAccessLogs',
          outputs: [
            {
              components: [
                { internalType: 'address', name: 'accessor', type: 'address' },
                { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
                { internalType: 'string', name: 'purpose', type: 'string' },
                { internalType: 'string', name: 'recordCID', type: 'string' },
                { internalType: 'bool', name: 'granted', type: 'bool' },
              ],
              internalType: 'struct ConsentManager.AccessLog[]',
              name: '',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        // Add access events from dashboard for event-based fallback
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
            { indexed: true, internalType: 'address', name: 'grantee', type: 'address' },
            { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
            { indexed: false, internalType: 'uint256', name: 'expiration', type: 'uint256' },
          ],
          name: 'AccessGranted',
          type: 'event',
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: 'address', name: 'patient', type: 'address' },
            { indexed: true, internalType: 'address', name: 'grantee', type: 'address' },
            { indexed: false, internalType: 'string', name: 'ipfsCid', type: 'string' },
          ],
          name: 'AccessRevoked',
          type: 'event',
        },
      ];

      // Use medical record access contract from dashboard for access logs
      const accessContractAddr = ethers.getAddress('0x9E32f3956d862A733012F97d5E7CF5B1767B13D8');
      const contract = new ethers.Contract(accessContractAddr, contractABI, provider);

      const grantedFilter = contract.filters.AccessGranted(address);
      const revokedFilter = contract.filters.AccessRevoked(address);

      const grantedEvents = await contract.queryFilter(grantedFilter);
      const revokedEvents = await contract.queryFilter(revokedFilter);

      const allEvents = [...grantedEvents, ...revokedEvents];

      const formattedLogs = await Promise.all(
        allEvents.map(async (event, index) => {
          const block = await provider.getBlock(event.blockNumber);
          const isGranted = event.eventName === 'AccessGranted' || event.fragment.name === 'AccessGranted';
          return {
            id: index,
            accessor: isGranted ? event.args.grantee : event.args.grantee,
            timestamp: new Date(Number(block.timestamp) * 1000),
            purpose: 'Medical Record Access', // Not in event; use fallback or add to ABI if available
            recordCID: event.args.ipfsCid,
            granted: isGranted,
            type: 'access',
            status: isGranted ? 'granted' : 'revoked',
          };
        })
      );

      setAccessLogs(formattedLogs.sort((a, b) => b.timestamp - a.timestamp)); // Sort latest first

    } catch (error) {
      console.error('Error loading access logs:', error);
      setAccessLogs([]);
      setError('Failed to load access logs. Check console for details or ensure correct network.');
    }
  };

  const allActivities = [...consentHistory, ...accessLogs].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = 
      activity.consentHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.accessor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.recordCID?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'consent' && activity.type === 'consent') ||
      (filterType === 'access' && activity.type === 'access') ||
      (filterType === 'active' && activity.status === 'active') ||
      (filterType === 'revoked' && activity.status === 'revoked');

    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['Type', 'Timestamp', 'Status', 'Details', 'IPFS CID', 'Transaction Hash'];
    const csvData = allActivities.map(activity => [
      activity.type === 'consent' ? 'Consent Agreement' : 'Access Log',
      activity.timestamp.toISOString(),
      activity.status,
      activity.type === 'consent' ? `Version ${activity.version}` : `Access by ${activity.accessor?.slice(0, 8)}... for ${activity.purpose}`,
      activity.ipfsCID || activity.recordCID || 'N/A',
      activity.consentHash?.slice(0, 16) + '...' || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'revoked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'granted':
        return 'bg-green-500/20 text-green-400';
      case 'revoked':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Consent History...</p>
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
                <p className="text-gray-400 text-xs">Consent History & Access Logs</p>
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
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Back to Dashboard
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
          </motion.div>
        )}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Consent History & Access Logs</h2>
              <p className="text-gray-400">
                View your signed consent agreements and track who has accessed your medical records
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="text-gray-400 text-sm font-medium">Total Consents</h3>
            </div>
            <p className="text-white text-2xl font-bold">{consentHistory.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-green-500" />
              <h3 className="text-gray-400 text-sm font-medium">Active Consents</h3>
            </div>
            <p className="text-white text-2xl font-bold">
              {consentHistory.filter(c => c.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <h3 className="text-gray-400 text-sm font-medium">Access Events</h3>
            </div>
            <p className="text-white text-2xl font-bold">{accessLogs.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-yellow-500" />
              <h3 className="text-gray-400 text-sm font-medium">Recent Activity</h3>
            </div>
            <p className="text-white text-2xl font-bold">
              {allActivities.filter(a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by hash, address, purpose, or CID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Activities</option>
                <option value="consent">Consent Agreements</option>
                <option value="access">Access Logs</option>
                <option value="active">Active/Granted</option>
                <option value="revoked">Revoked</option>
              </select>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">{filteredActivities.length} results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No activities found</h3>
              <p className="text-gray-400">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No consent agreements or access logs found for your account'
                }
              </p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'consent' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                      }`}>
                        {activity.type === 'consent' ? (
                          <Shield className="w-5 h-5 text-blue-400" />
                        ) : (
                          <User className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {activity.type === 'consent' 
                            ? 'Consent Agreement Signed' 
                            : `Access ${activity.granted ? 'Granted' : 'Revoked'}`
                          }
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {activity.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(activity.status)}
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </div>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {activity.type === 'consent' ? (
                        <>
                          <div>
                            <p className="text-gray-400 mb-1">Consent Version</p>
                            <p className="text-white font-mono">{activity.version}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">IPFS CID</p>
                            <p className="text-white font-mono text-xs break-all">{activity.ipfsCID}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-gray-400 mb-1">Accessed By</p>
                            <p className="text-white font-mono">
                              {activity.accessor?.slice(0, 8)}...{activity.accessor?.slice(-6)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Purpose</p>
                            <p className="text-white">{activity.purpose}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-gray-400 mb-1">Record CID</p>
                        <p className="text-white font-mono text-xs break-all">
                          {activity.recordCID || activity.ipfsCID}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Transaction Hash</p>
                        <p className="text-white font-mono text-xs break-all">
                          {activity.consentHash?.slice(0, 16)}...{activity.consentHash?.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 lg:flex-col">
                    {activity.ipfsCID && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${activity.ipfsCID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Document
                      </a>
                    )}
                    {activity.consentHash && activity.consentHash !== 'N/A' && (
                      <a
                        href={`https://primordial.bdagscan.com/tx/${activity.consentHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Transaction
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ConsentHistoryPage;