'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Shield Icon Component
const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Lock Icon Component
const Lock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Check Icon Component
const Check = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function HealthcareLandingPage() {
  const containerRef = useRef(null);
  const featuresRef = useRef(null);
  const solutionsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  // Hero section animations
  const imageScale = useTransform(scrollYProgress, [0, 1], [3, 1]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.9, 0.7]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  
  // Header animations
  const headerBg = useTransform(scrollYProgress, [0, 0.1], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.95)']);
  const headerShadow = useTransform(scrollYProgress, [0, 0.1], ['0 0 0 rgba(0,0,0,0)', '0 4px 20px rgba(0,0,0,0.3)']);
  
  // Text animations
  const textScale = useTransform(scrollYProgress, [0, 0.25, 0.45], [1, 0.6, 0.5]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.25, 0.5], [1, 0.7, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.5], ['0vh', '-10vh']);
  
  // Atmospheric haze
  const hazeOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.1, 0.25]);

  // Smoother brush drawing animations
  const brushProgress1 = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const brushProgress2 = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
  const brushProgress3 = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);

  // Smoother wireframe element animations
  const elementScale1 = useTransform(scrollYProgress, [0, 0.4], [0.8, 1]);
  const elementScale2 = useTransform(scrollYProgress, [0.1, 0.5], [0.8, 1]);
  const elementOpacity1 = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const elementOpacity2 = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);

  // Features section scroll animations
  const { scrollYProgress: featuresScroll } = useScroll({
    target: featuresRef,
    offset: ['start end', 'end start']
  });

  const featuresY = useTransform(featuresScroll, [0, 1], [100, -100]);
  const featuresOpacity = useTransform(featuresScroll, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Navigation Header */}
      <motion.nav 
        style={{ 
          backgroundColor: headerBg,
          boxShadow: headerShadow
        }}
        className="fixed top-0 right-0 left-0 z-50 pointer-events-auto transition-all duration-300 bg-black/95 backdrop-blur-lg"
      >
        <div className="h-16 lg:h-20">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-500" />
                <div className="text-white font-semibold text-xl">HealthSecure</div>
              </div>
            </div>

            {/* Desktop Navigation - Centered */}
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
              <div className="flex items-center gap-8 xl:gap-12">
                <a href="#solutions" className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors duration-200">
                  Solutions
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </a>
                <a href="#security" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">
                  Security
                </a>
                <a href="#about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">
                  About
                </a>
                <a href="#compliance" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">
                  Compliance
                </a>
              </div>
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl cursor-pointer transition-all duration-300 h-10 px-6 bg-transparent border border-gray-600 text-gray-400 hover:border-blue-500 hover:text-white font-medium text-sm">
                View Solutions
              </button>
              <a className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl cursor-pointer transition-all duration-300 h-10 px-6 bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm" href="#contact">
                Get Started
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden absolute top-16 left-0 right-0 bg-black border-t border-gray-800 transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
            <div className="px-4 py-6 space-y-4">
              <a className="block text-lg font-medium text-gray-400 hover:text-white py-2 transition-colors duration-200" href="#solutions">
                Solutions
              </a>
              <a className="block text-lg font-medium text-gray-400 hover:text-white py-2 transition-colors duration-200" href="#security">
                Security
              </a>
              <a className="block text-lg font-medium text-gray-400 hover:text-white py-2 transition-colors duration-200" href="#about">
                About
              </a>
              <a className="block text-lg font-medium text-gray-400 hover:text-white py-2 transition-colors duration-200" href="#compliance">
                Compliance
              </a>
              <div className="pt-4 space-y-3">
                <button className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-2xl cursor-pointer transition-all duration-300 h-12 bg-transparent border border-gray-600 text-gray-400 hover:border-blue-500 hover:text-white font-medium text-base">
                  View Solutions
                </button>
                <a className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-2xl cursor-pointer transition-all duration-300 h-12 bg-blue-600 text-white hover:bg-blue-700 font-medium text-base" href="#contact">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Zoom Container */}
      <div ref={containerRef} className="relative h-[400vh] bg-gray-500">
        
        {/* Sticky Viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-gray-500">
          
          {/* Enhanced SVG Background with Healthcare Security Visualization */}
          <motion.div
            style={{
              scale: imageScale,
              y: imageY,
              opacity: imageOpacity,
            }}
            className="absolute inset-0 w-full h-full will-change-transform origin-center"
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 1200"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Your existing SVG content remains the same */}
              <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6b7280', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#4b5563', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#374151', stopOpacity: 1 }} />
                </linearGradient>
                
                {/* Grid pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5"/>
                </pattern>

                {/* Dots pattern */}
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="0.3" fill="rgba(59, 130, 246, 0.15)"/>
                </pattern>

                {/* Healthcare security gradients */}
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.25" />
                </linearGradient>

                <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#115E59" stopOpacity="0.25" />
                </linearGradient>

                <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3730A3" stopOpacity="0.25" />
                </linearGradient>

                <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.25" />
                </linearGradient>

                {/* Secure connection gradients */}
                <linearGradient id="secureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.8" />
                </linearGradient>

                {/* Arrow marker */}
                <marker
                  id="arrowhead"
                  markerWidth="4"
                  markerHeight="4"
                  refX="3"
                  refY="2"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 4 2, 0 4"
                    fill="#3B82F6"
                  />
                </marker>

                {/* Shield marker for security */}
                <marker
                  id="shieldhead"
                  markerWidth="6"
                  markerHeight="6"
                  refX="3"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M3 1L4 2L5 1C5 1 5 3 3 5C1 3 1 1 1 1L2 2Z"
                    fill="#10B981"
                    stroke="#10B981"
                    strokeWidth="0.5"
                  />
                </marker>

                {/* Lock marker */}
                <marker
                  id="lockhead"
                  markerWidth="6"
                  markerHeight="6"
                  refX="3"
                  refY="3"
                  orient="auto"
                >
                  <rect x="1" y="2" width="4" height="3" rx="1" fill="#3B82F6" stroke="#3B82F6" strokeWidth="0.5"/>
                  <path d="M3 2V1C3 0.5 3.5 0 4 0C4.5 0 5 0.5 5 1V2" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
                </marker>
              </defs>
              
              {/* Base gradient */}
              <rect width="1200" height="1200" fill="url(#bgGradient)" />
              
              {/* Grid */}
              <rect width="1200" height="1200" fill="url(#grid)" />
              
              {/* Dots */}
              <rect width="1200" height="1200" fill="url(#dots)" />
              
              {/* Secure Connection Lines */}
              <g className="secure-connections">
                <motion.path
                  d="M 100 200 Q 300 150 500 250 T 900 200"
                  fill="none"
                  stroke="url(#secureGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={{
                    pathLength: brushProgress1,
                    opacity: brushProgress1
                  }}
                />
                
                <motion.path
                  d="M 150 400 Q 350 350 600 450 T 1000 400"
                  fill="none"
                  stroke="url(#secureGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    pathLength: brushProgress2,
                    opacity: brushProgress2
                  }}
                />
              </g>

              {/* Healthcare Security Interfaces */}
              <motion.g
                style={{
                  scale: elementScale1,
                  opacity: elementOpacity1,
                }}
                className="transform-gpu"
              >
                <rect x="50" y="80" width="500" height="320" fill="none" stroke="#3B82F6" strokeWidth="2" rx="12"/>
                <rect x="65" y="100" width="470" height="25" fill="url(#blueGradient)" rx="8"/>
                
                {/* Security Status Header */}
                <rect x="65" y="135" width="470" height="35" fill="rgba(16, 185, 129, 0.15)" rx="6"/>
                <rect x="75" y="142" width="120" height="12" fill="#10B981" fillOpacity="0.9" rx="3"/>
                <path d="M210 142 L215 147 L210 152" fill="none" stroke="#10B981" strokeWidth="1.5"/>
                <text x="225" y="152" fontSize="10" fill="#10B981" fontFamily="monospace">HIPAA ACTIVE</text>
                
                {/* Patient Records Section */}
                <rect x="65" y="180" width="220" height="120" fill="url(#blueGradient)" rx="8"/>
                <rect x="75" y="190" width="200" height="20" fill="#3B82F6" fillOpacity="0.8" rx="4"/>
                <rect x="75" y="220" width="180" height="8" fill="#d1d5db" fillOpacity="0.8" rx="2"/>
                <rect x="75" y="235" width="160" height="8" fill="#d1d5db" fillOpacity="0.8" rx="2"/>
                <rect x="75" y="260" width="120" height="25" fill="#10B981" fillOpacity="0.9" rx="5"/>
                
                {/* Transfer Monitor */}
                <rect x="300" y="180" width="220" height="120" fill="rgba(59, 130, 246, 0.08)" rx="8"/>
                <rect x="310" y="190" width="200" height="15" fill="#3B82F6" fillOpacity="0.7" rx="3"/>
                
                {/* Security Badges */}
                <rect x="310" y="220" width="85" height="25" fill="#10B981" fillOpacity="0.2" rx="5">
                  <animate attributeName="fill-opacity" values="0.2;0.3;0.2" dur="2s" repeatCount="indefinite"/>
                </rect>
                <rect x="405" y="220" width="85" height="25" fill="#3B82F6" fillOpacity="0.2" rx="5">
                  <animate attributeName="fill-opacity" values="0.2;0.3;0.2" dur="2s" repeatCount="indefinite" begin="0.5s"/>
                </rect>
                <rect x="500" y="220" width="85" height="25" fill="#0D9488" fillOpacity="0.2" rx="5">
                  <animate attributeName="fill-opacity" values="0.2;0.3;0.2" dur="2s" repeatCount="indefinite" begin="1s"/>
                </rect>
              </motion.g>

              {/* Additional healthcare interfaces */}
              <motion.g
                style={{
                  scale: elementScale2,
                  opacity: elementOpacity2,
                }}
                className="transform-gpu"
              >
                <rect x="600" y="100" width="450" height="300" fill="none" stroke="#0D9488" strokeWidth="2" rx="12"/>
                <rect x="615" y="120" width="420" height="25" fill="url(#tealGradient)" rx="8"/>
                
                {/* Imaging Security Header */}
                <rect x="615" y="155" width="420" height="50" fill="rgba(13, 148, 136, 0.12)" rx="6"/>
                <rect x="625" y="165" width="150" height="12" fill="#0D9488" fillOpacity="0.9" rx="3"/>
                <rect x="625" y="185" width="200" height="8" fill="#d1d5db" fillOpacity="0.7" rx="2"/>
                
                {/* Secure Medical Images */}
                <rect x="625" y="215" width="130" height="160" fill="url(#tealGradient)" rx="8"/>
                <rect x="635" y="225" width="110" height="80" fill="rgba(255,255,255,0.15)" rx="6"/>
                {/* Medical Cross Symbol */}
                <rect x="675" y="255" width="10" height="40" fill="#0D9488" fillOpacity="0.8" rx="2"/>
                <rect x="655" y="275" width="50" height="10" fill="#0D9488" fillOpacity="0.8" rx="2"/>
                
                <rect x="770" y="215" width="130" height="160" fill="url(#tealGradient)" rx="8"/>
                <rect x="780" y="225" width="110" height="80" fill="rgba(255,255,255,0.15)" rx="6"/>
                {/* ECG Line */}
                <path d="M785 255 L795 250 L805 260 L815 255 L825 265 L835 260" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"/>
                
                <rect x="915" y="215" width="130" height="160" fill="url(#tealGradient)" rx="8"/>
                <rect x="925" y="225" width="110" height="80" fill="rgba(255,255,255,0.15)" rx="6"/>
                {/* Brain Scan Symbol */}
                <ellipse cx="980" cy="265" rx="25" ry="15" fill="none" stroke="#0D9488" strokeWidth="1.5"/>
                <path d="M965 255 L975 260 L985 255 M965 275 L975 270 L985 275" fill="none" stroke="#0D9488" strokeWidth="1.5"/>
              </motion.g>

              {/* Secure Connection Arrows */}
              <g className="secure-arrows">
                <motion.path
                  d="M 560 240 L 600 140"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  markerEnd="url(#shieldhead)"
                  style={{
                    pathLength: brushProgress1,
                    opacity: brushProgress1
                  }}
                />
                
                <motion.path
                  d="M 1050 300 L 1100 450"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  markerEnd="url(#lockhead)"
                  style={{
                    pathLength: brushProgress2,
                    opacity: brushProgress2
                  }}
                />
              </g>

              {/* Animated Security Shields */}
              <motion.g
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <rect x="1100" y="200" width="80" height="60" fill="none" stroke="#10B981" strokeWidth="1.5" rx="6"/>
                <path d="M1120 215 L1125 220 L1120 225" fill="none" stroke="#10B981" strokeWidth="1.5"/>
                <text x="1130" y="235" fontSize="8" fill="#10B981" fontFamily="monospace">SECURE</text>
                <text x="1130" y="245" fontSize="6" fill="#10B981" fontFamily="monospace">HIPAA</text>
              </motion.g>

              {/* Pulsing Security Indicators */}
              <motion.circle
                cx="800"
                cy="350"
                r="4"
                fill="#10B981"
                fillOpacity="0.8"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <motion.circle
                cx="950"
                cy="700"
                r="3"
                fill="#0D9488"
                fillOpacity="0.8"
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />

            </svg>
          </motion.div>

          {/* Atmospheric Haze Layer */}
          <motion.div 
            style={{ opacity: hazeOpacity }}
            className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-gray-500/5 to-indigo-900/15 pointer-events-none z-10"
          />

          {/* Centered Text Content */}
          <motion.div
            style={{
              y: textY,
              opacity: textOpacity,
              scale: textScale,
            }}
            className="absolute top-0 left-0 right-0 bottom-0 z-20 flex flex-col items-center justify-center text-center px-3 sm:px-6 lg:px-8"
          >
            <div className="max-w-4xl lg:max-w-6xl w-full">
              <motion.h1 
                className="font-akkurat font-[100] tracking-[-0.02em] text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6 leading-tight"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                Secure Healthcare
                <br className="hidden xs:block" />
                <motion.span 
                  className="bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0%', '100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                  }}
                >
                  Data Exchange
                </motion.span>
              </motion.h1>

              <motion.p 
                className="text-base xs:text-lg sm:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              >
                HIPAA compliant solutions for secure patient data transfer and healthcare communication
              </motion.p>

              {/* Trusted by section - Healthcare Focused */}
              <motion.div 
                className="mt-8 sm:mt-12 max-w-4xl mx-auto overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4">Trusted by leading healthcare providers</p>
                <div className="relative w-full">
                  <div className="flex items-center">
                    <motion.div 
                      className="flex items-center gap-8 sm:gap-12 whitespace-nowrap"
                      animate={{
                        x: [0, -1000],
                      }}
                      transition={{
                        x: {
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                        },
                      }}
                    >
                      {/* First set */}
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Mayo Clinic</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Cleveland Clinic</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Johns Hopkins</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Mass General</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">UCLA Health</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">NYU Langone</span>
                      {/* Second set for seamless loop */}
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Mayo Clinic</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Cleveland Clinic</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Johns Hopkins</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">Mass General</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">UCLA Health</span>
                      <span className="text-white font-bold text-sm sm:text-lg opacity-80">NYU Langone</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div 
                className="mt-8 sm:mt-12 flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-sm mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                <motion.button 
                  className="w-full xs:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 h-10 sm:h-12 px-6 sm:px-8 bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl shadow-blue-500/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Schedule Demo
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </motion.button>
                <motion.button 
                  className="w-full xs:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 h-10 sm:h-12 px-6 sm:px-8 bg-transparent border border-gray-600 text-white hover:border-blue-400 font-medium text-sm sm:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Solutions
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section ref={featuresRef} className="relative bg-black py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 lg:mb-24"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Enterprise-Grade <span className="text-blue-500">Security</span> Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built with healthcare compliance and data protection at the core
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "HIPAA Compliant",
                description: "Full compliance with healthcare regulations including HIPAA, HITECH, and GDPR requirements.",
                features: ["Encrypted Data Storage", "Access Controls", "Audit Logging"]
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: "End-to-End Encryption",
                description: "Military-grade encryption for all data in transit and at rest with zero-knowledge architecture.",
                features: ["AES-256 Encryption", "TLS 1.3", "Zero-Knowledge Proofs"]
              },
              {
                icon: <Check className="w-8 h-8" />,
                title: "Automated Compliance",
                description: "Automated compliance monitoring and reporting to maintain continuous regulatory adherence.",
                features: ["Real-time Monitoring", "Automated Reporting", "Compliance Dashboard"]
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="text-blue-500 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="relative bg-gray-900 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 lg:mb-24"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Healthcare <span className="text-teal-500">Solutions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Specialized tools for secure healthcare data management and exchange
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {[
                {
                  title: "Secure Patient Portal",
                  description: "Encrypted patient communication and document sharing with multi-factor authentication.",
                  stats: "99.9% Uptime"
                },
                {
                  title: "Medical Imaging Transfer",
                  description: "High-speed DICOM image transfer with lossless compression and end-to-end encryption.",
                  stats: "HIPAA Compliant"
                },
                {
                  title: "Insurance Claims Platform",
                  description: "Secure electronic claims submission with real-time status tracking and analytics.",
                  stats: "Fast Processing"
                }
              ].map((solution, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-teal-500/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{solution.title}</h3>
                    <span className="text-teal-500 text-sm font-medium bg-teal-500/10 px-3 py-1 rounded-full">
                      {solution.stats}
                    </span>
                  </div>
                  <p className="text-gray-400">{solution.description}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-8 aspect-video flex items-center justify-center">
                <div className="text-center text-white">
                  <Lock className="w-16 h-16 mx-auto mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold mb-2">Secure Architecture</h3>
                  <p className="text-teal-100">Enterprise-grade security infrastructure</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-black py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to Secure Your Healthcare Data?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare providers who trust HealthSecure for their data protection needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-medium text-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Start Free Trial
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-gray-600 text-white rounded-2xl font-medium text-lg hover:border-blue-400 transition-colors duration-300"
              >
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-8 h-8 text-blue-500" />
                <div className="text-white font-bold text-2xl">HealthSecure</div>
              </div>
              <p className="text-gray-400 max-w-md">
                Leading healthcare data security and compliance solutions for modern healthcare providers.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Patient Portals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Medical Imaging</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Claims Processing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Telehealth</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HealthSecure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}