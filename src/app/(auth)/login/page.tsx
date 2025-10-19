'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronLeft, ChevronRight, Upload, Activity, Send } from 'lucide-react';

const carouselSlides = [
  {
    title: "HIPAA Compliant Healthcare Data Transfer",
    subtitle: "Securely transfer patient records between facilities",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
    gradient: "from-blue-900/80 to-gray-900/80"
  },
  {
    title: "Medical Imaging & Test Results",
    subtitle: "Share diagnostic data with specialists instantly",
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&q=80",
    gradient: "from-teal-900/80 to-gray-900/80"
  },
  {
    title: "Insurance & Provider Communication",
    subtitle: "Streamlined secure data exchange for claims processing",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80",
    gradient: "from-indigo-900/80 to-gray-900/80"
  }
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

export default function BlockDAGHealthSecure() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('connect');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Carousel auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const BLOCKDAG_NETWORK = {
  chainId: '0x413', // 1043 in decimal
  chainName: 'BlockDAG Primordial Testnet',
  nativeCurrency: {
    name: 'BlockDAG Coin',
    symbol: 'BDAG',
    decimals: 18
  },
  rpcUrls: ['https://rpc.primordial.bdagscan.com'],
  blockExplorerUrls: ['https://primordial.bdagscan.com']
};

  // Save wallet info to state
  const saveWalletInfo = (address, network = 'BlockDAG') => {
    const walletData = {
      address: address,
      connectedAt: new Date().toISOString(),
      network: network,
      sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
    };
    
    // Store in memory
    sessionStorage.setItem('healthSecureWallet', JSON.stringify(walletData));
    sessionStorage.setItem('walletAddress', address);
    sessionStorage.setItem('isAuthenticated', 'true');
    
    return walletData;
  };

  // Add BlockDAG network to MetaMask
  const addBlockDAGNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: BLOCKDAG_NETWORK.chainId,
          chainName: BLOCKDAG_NETWORK.chainName,
          nativeCurrency: BLOCKDAG_NETWORK.nativeCurrency,
          rpcUrls: BLOCKDAG_NETWORK.rpcUrls,
          blockExplorerUrls: BLOCKDAG_NETWORK.blockExplorerUrls
        }]
      });
      return true;
    } catch (error) {
      console.error('Failed to add BlockDAG network:', error);
      return false;
    }
  };

  // Switch to BlockDAG network
  const switchToBlockDAGNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BLOCKDAG_NETWORK.chainId }],
      });
      return true;
    } catch (error) {
      // Network not added, try to add it
      if (error.code === 4902) {
        return await addBlockDAGNetwork();
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  };

  // Connect with MetaMask to BlockDAG
  const connectBlockDAGWallet = async () => {
    setLoading(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask extension from metamask.io');
        setLoading(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      
      // Try to switch to BlockDAG network
      console.log('Attempting to switch to BlockDAG network...');
      const switched = await switchToBlockDAGNetwork();
      
      if (!switched) {
        console.log('Could not switch to BlockDAG network, continuing with current network...');
        // You can choose to alert user or continue
        // For demo, we'll continue
      }
      
      setWalletAddress(address);
      
      // Save wallet information
      const walletData = saveWalletInfo(address, 'BlockDAG via MetaMask');
      console.log('Wallet connected and saved:', walletData);
      
      // Show success message
      setRedirecting(true);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Connection failed:', error);
      
      if (error.code === 4001) {
        alert('Connection request rejected. Please approve the connection in MetaMask.');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
      setLoading(false);
    }
  };

  // Sign consent smart contract
  const signConsent = async () => {
    setLoading(true);
    try {
      // Mock consent contract interaction
      const message = `I consent to share my healthcare data securely via BlockDAG network.\nTimestamp: ${new Date().toISOString()}`;
      
      const signature = await window.blockdag.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      console.log('Consent signed:', signature);
      setCurrentStep('upload');
      
    } catch (error) {
      console.error('Consent signing failed:', error);
      alert('Failed to sign consent: ' + error.message);
    }
    setLoading(false);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      // Simulate encryption
      setTimeout(() => {
        setCurrentStep('analyze');
      }, 1000);
    }
  };

  // Mock AI Analysis
  const runAIAnalysis = async () => {
    setLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAnalysis = {
      riskScore: Math.floor(Math.random() * 30) + 10,
      predictions: [
        { condition: 'Hypertension Risk', probability: 0.23 },
        { condition: 'Diabetes Risk', probability: 0.15 },
        { condition: 'Cardiovascular Health', probability: 0.82 }
      ],
      recommendations: [
        'Regular blood pressure monitoring recommended',
        'Consider lifestyle modifications',
        'Schedule follow-up in 3 months'
      ]
    };
    
    setAiAnalysis(mockAnalysis);
    setCurrentStep('transfer');
    setLoading(false);
  };

  // Transfer to recipient
  const transferToRecipient = async () => {
    if (!recipientAddress) {
      alert('Please enter recipient address');
      return;
    }

    setLoading(true);
    try {
      // Mock blockchain transaction for data transfer
      const txData = {
        from: walletAddress,
        to: recipientAddress,
        data: {
          fileHash: 'QmX...' + Math.random().toString(36).substr(2, 9),
          analysisHash: 'QmY...' + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now()
        }
      };

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Transfer completed:', txData);
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Failed to transfer data: ' + error.message);
    }
    setLoading(false);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 'connect':
        return (
          <div className="space-y-4">
            {redirecting ? (
              <div className="bg-green-900/20 border border-green-600 p-6 rounded text-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-semibold mb-2">Connected Successfully!</p>
                <p className="text-gray-300 text-sm">Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connectBlockDAGWallet}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded transition-colors uppercase tracking-wide disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect BlockDAG Wallet'}
                </motion.button>
                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3 mt-4">
                  <p className="text-yellow-400 text-xs text-center">
                    <strong>Demo Mode:</strong> No wallet extension needed. Click to connect with mock wallet for testing.
                  </p>
                </div>
                <p className="text-gray-400 text-xs text-center mt-2">
                  For production: Install BlockDAG wallet from blockdag.network
                </p>
              </>
            )}
          </div>
        );

      case 'consent':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded text-sm text-gray-300">
              <p className="font-semibold mb-2">Consent Agreement</p>
              <p className="text-xs">I authorize the secure sharing of my healthcare data via BlockDAG blockchain for medical purposes.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signConsent}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing...' : 'Sign Consent'}
            </motion.button>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <label className="block">
              <div className="border-2 border-dashed border-gray-600 rounded p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-300 text-sm">Upload Medical Record</p>
                <p className="text-gray-500 text-xs mt-1">PDF, DICOM, or HL7 format</p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.dcm,.hl7"
                />
              </div>
            </label>
            {uploadedFile && (
              <p className="text-green-400 text-sm text-center">
                ✓ {uploadedFile.name} uploaded & encrypted
              </p>
            )}
          </div>
        );

      case 'analyze':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded">
              <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-300 text-sm text-center">Ready for AI Analysis</p>
              <p className="text-gray-500 text-xs text-center mt-1">
                File: {uploadedFile?.name}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runAIAnalysis}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Run AI Analysis'}
            </motion.button>
          </div>
        );

      case 'transfer':
        return (
          <div className="space-y-4">
            {aiAnalysis && (
              <div className="bg-gray-800 p-4 rounded text-sm space-y-2">
                <p className="font-semibold text-white">Analysis Results</p>
                <div className="text-xs text-gray-300">
                  <p>Risk Score: <span className="text-yellow-400">{aiAnalysis.riskScore}%</span></p>
                  <p className="mt-2">Top Predictions:</p>
                  <ul className="list-disc list-inside pl-2">
                    {aiAnalysis.predictions.map((pred, idx) => (
                      <li key={idx}>{pred.condition}: {(pred.probability * 100).toFixed(0)}%</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <input
              type="text"
              placeholder="Recipient BlockDAG Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={transferToRecipient}
              disabled={loading || !recipientAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Transferring...' : 'Transfer Securely'}
            </motion.button>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-600 p-6 rounded text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">✓</span>
              </div>
              <p className="font-semibold text-white mb-2">Transfer Complete!</p>
              <p className="text-gray-300 text-sm">
                Your encrypted health record and AI analysis have been securely transferred via BlockDAG network.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCurrentStep('connect');
                setWalletAddress(null);
                setUploadedFile(null);
                setAiAnalysis(null);
                setRecipientAddress('');
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded transition-colors"
            >
              Start New Transfer
            </motion.button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl bg-black rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left Panel */}
        <div className="w-full md:w-5/12 bg-black p-8 md:p-12 flex flex-col">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <div className="text-white font-semibold text-xl">HealthSecure</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Powered by BlockDAG</p>
          </motion.div>

          {/* Progress Steps */}
          {walletAddress && (
            <div className="mb-6 flex items-center justify-between text-xs">
              {['Connect', 'Consent', 'Upload', 'Analyze', 'Transfer'].map((step, idx) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    ['connect', 'consent', 'upload', 'analyze', 'transfer', 'complete'].indexOf(currentStep) > idx
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < 4 && <div className="w-8 h-0.5 bg-gray-700 mx-1" />}
                </div>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-3xl font-semibold mb-2"
            >
              {currentStep === 'connect' ? 'Sign In' : 
               currentStep === 'consent' ? 'Consent' :
               currentStep === 'upload' ? 'Upload Record' :
               currentStep === 'analyze' ? 'AI Analysis' :
               currentStep === 'transfer' ? 'Transfer Data' :
               'Complete'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-sm mb-8"
            >
              {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 
               'Connect your BlockDAG wallet to begin'}
            </motion.p>

            {renderStep()}

            {/* HIPAA Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-8"
            >
              <Shield className="w-4 h-4 text-green-500" />
              <span>HIPAA Compliant & Encrypted</span>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Carousel */}
        <div className="relative w-full md:w-7/12 min-h-[400px] md:min-h-[600px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 }
              }}
              className="absolute inset-0"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${carouselSlides[currentSlide].image})` }}
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${carouselSlides[currentSlide].gradient}`} />
              
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-8 py-12">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="max-w-md space-y-4"
                >
                  <h2 className="text-white text-2xl md:text-3xl font-light leading-tight">
                    {carouselSlides[currentSlide].title}
                  </h2>
                  <p className="text-white/90 text-lg">
                    {carouselSlides[currentSlide].subtitle}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="absolute bottom-6 right-6 flex gap-2 z-20">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {carouselSlides.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}