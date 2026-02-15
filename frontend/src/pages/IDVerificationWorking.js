import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { loadFaceApiModels, compareFaces } from '../utils/faceApiHelper';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 3D Scanning Animation Component
function ScanningAnimation({ isScanning }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={false} autoRotate={isScanning} autoRotateSpeed={2} />
      <Box args={[1.5, 2, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ff791a" wireframe={isScanning} opacity={0.7} transparent />
      </Box>
      {isScanning && (
        <>
          <Sphere args={[0.1, 16, 16]} position={[-0.5, 0.3, 0.2]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
          </Sphere>
          <Sphere args={[0.1, 16, 16]} position={[0.5, 0.3, 0.2]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
          </Sphere>
          <Sphere args={[0.1, 16, 16]} position={[0, -0.2, 0.2]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
          </Sphere>
        </>
      )}
    </Canvas>
  );
}

const IDVerificationPage = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload, capture, processing, result
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [documentType, setDocumentType] = useState('pan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  // Load face-api models on mount
  useEffect(() => {
    let cancelled = false;
    
    const loadModels = async () => {
      try {
        console.log('Starting to load face-api.js models...');
        const loaded = await loadFaceApiModels();
        if (!cancelled) {
          setModelsLoaded(loaded);
          if (loaded) {
            console.log('✅ Face detection models loaded successfully!');
          } else {
            console.warn('⚠️ Face detection models not loaded - face matching may not work');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Failed to load face models:', err);
        }
      }
    };
    
    loadModels();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to safely extract error message
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.detail) {
      if (typeof error.detail === 'string') return error.detail;
      if (Array.isArray(error.detail)) {
        return error.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
      }
      return JSON.stringify(error.detail);
    }
    return 'An error occurred';
  };

  // Handle document upload
  const handleDocumentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Proceed to face capture
  const proceedToCapture = () => {
    if (!documentFile) {
      setError('Please upload a document first');
      return;
    }
    setStep('capture');
  };

  // Camera ready handler
  const handleCameraReady = () => {
    setCameraReady(true);
    setCameraError(null);
  };

  // Camera error handler
  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError('Camera access denied. Please allow camera permissions.');
    setCameraReady(false);
  };

  // Capture selfie
  const captureSelfie = useCallback(() => {
    if (!webcamRef.current) {
      setError('Camera not ready');
      return;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setSelfieImage(imageSrc);
      setCameraError(null);
    } else {
      setError('Failed to capture image');
    }
  }, [webcamRef]);

  // Retake selfie
  const retakeSelfie = () => {
    setSelfieImage(null);
  };

  // Submit for verification
  const submitVerification = async () => {
    if (!documentFile || !selfieImage) {
      setError('Both document and selfie are required');
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      console.log('Starting verification process...');
      
      // Step 1: Upload document
      setProgress(20);
      setProcessingStage('Uploading document...');
      console.log('Uploading document...');
      
      const formData = new FormData();
      formData.append('file', documentFile);

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000
      });

      console.log('Upload response:', uploadResponse.data);
      const docId = uploadResponse.data.document_id;
      setProgress(40);

      // Step 2: Process document
      setProcessingStage('Processing document...');
      console.log('Processing document...');
      
      const processResponse = await axios.post(`${API_BASE_URL}/api/documents/process`, {
        document_id: docId,
        document_type: documentType,
        use_gemini: true
      }, { timeout: 30000 });

      console.log('Process response:', processResponse.data);

      const jobId = processResponse.data.job_id;
      setProgress(60);

      // Step 3: Poll for document processing results
      setProcessingStage('Extracting document data...');
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusResponse = await axios.get(`${API_BASE_URL}/api/documents/status/${jobId}`);
          const status = statusResponse.data;

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(70);

            // Get processed document results
            const resultsResponse = await axios.get(`${API_BASE_URL}/api/documents/results/${docId}`);
            setProgress(80);

            // Step 4: Client-side face matching using face-api.js
            setProcessingStage('Detecting faces...');
            setProgress(85);

            try {
              // Compare faces using face-api.js (runs in browser)
              const faceMatchResult = await compareFaces(selfieImage, documentPreview);
              setProgress(95);

              setProcessingStage('Matching biometric features...');
              
              // Combine results
              setProgress(100);
              setResult({
                documentData: resultsResponse.data,
                faceMatch: {
                  matched: faceMatchResult.match,
                  confidence: faceMatchResult.confidence,
                  distance: faceMatchResult.distance,
                  method: 'face-api.js (client-side)',
                  facesDetected: faceMatchResult.facesDetected,
                  error: faceMatchResult.error
                }
              });
              setStep('result');
              setIsProcessing(false);
              setProcessingStage('');
            } catch (faceErr) {
              console.error('Face matching error:', faceErr);
              // Still show results but indicate face match failed
              setResult({
                documentData: resultsResponse.data,
                faceMatch: {
                  matched: false,
                  confidence: 0,
                  error: faceErr.message || 'Face matching failed'
                }
              });
              setStep('result');
              setIsProcessing(false);
              setProcessingStage('');
            }

          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            const errorMsg = status.message || 'Processing failed - see backend logs';
            throw new Error(errorMsg);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            // Try to get final status
            try {
              const finalStatus = await axios.get(`${API_BASE_URL}/api/documents/status/${jobId}`);
              if (finalStatus.data.status === 'failed') {
                throw new Error(finalStatus.data.message || 'Processing failed');
              }
            } catch (finalErr) {
              console.error('Final status check error:', finalErr);
            }
            throw new Error('Processing timeout after 60 seconds. The API may be overloaded. Please try again.');
          } else {
            // Update progress during polling
            const baseProgress = 60 + (attempts * 0.5);
            setProgress(Math.min(baseProgress, 70));
          }
        } catch (err) {
          clearInterval(pollInterval);
          throw err;
        }
      }, 2000);

    } catch (err) {
      console.error('Verification error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code
      });
      
      let errorMsg;
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMsg = '🔴 Cannot connect to backend server. Please ensure:\n1. Backend is running (python run_backend.py)\n2. Backend is accessible at http://localhost:8000\n3. No firewall is blocking the connection';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. The server took too long to respond.';
      } else {
        errorMsg = err.response?.data ? getErrorMessage(err.response.data) : (err.message || 'Verification failed');
      }
      
      setError(errorMsg);
      setIsProcessing(false);
      setStep('upload');
      setProcessingStage('');
    }
  };

  // Reset and start over
  const startOver = () => {
    setStep('upload');
    setDocumentFile(null);
    setDocumentPreview(null);
    setSelfieImage(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="dark min-h-screen bg-background-dark">
      <div className="relative flex min-h-screen w-full flex-col max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between p-4 sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/10">
          <button 
            onClick={() => navigate(-1)}
            className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h2 className="text-white text-lg font-bold tracking-tight">ID Verification</h2>
          <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-2xl">help</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-400">
                <span className="material-symbols-outlined">error</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Step 1: Upload Document */}
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Upload ID Document</h1>
                <p className="text-gray-400">Upload your Aadhaar, PAN, or Driver's License</p>
              </div>

              {!documentPreview ? (
                <label className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-surface-dark/50 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-surface-dark cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-5xl">upload_file</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Upload Document</h3>
                  <p className="text-sm text-gray-400">Click to browse or drag and drop</p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={documentPreview} alt="Document" className="w-full h-auto" />
                    <button
                      onClick={() => {
                        setDocumentFile(null);
                        setDocumentPreview(null);
                      }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  {/* Document Type Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Document Type
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full bg-surface-dark border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="driving_license">Driving License</option>
                      <option value="passport">Passport</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={proceedToCapture}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next: Capture Selfie</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Capture Selfie */}
          {step === 'capture' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Capture Selfie</h1>
                <p className="text-gray-400">Position your face in the center</p>
              </div>

              {!selfieImage ? (
                <div className="space-y-4">
                  {cameraError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <span className="material-symbols-outlined">error</span>
                        <span className="text-sm font-medium">{cameraError}</span>
                      </div>
                    </div>
                  )}
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary aspect-[3/4] max-w-md mx-auto bg-black">
                    {!cameraError && (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        videoConstraints={{
                          width: { ideal: 1280 },
                          height: { ideal: 720 },
                          facingMode: "user"
                        }}
                        onUserMedia={handleCameraReady}
                        onUserMediaError={handleCameraError}
                      />
                    )}
                    {!cameraReady && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                          <p className="text-gray-400">Initializing camera...</p>
                        </div>
                      </div>
                    )}
                    {cameraReady && !cameraError && (
                      <div className="absolute inset-0 border-4 border-primary/30 rounded-xl pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-64 border-2 border-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('upload')}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={captureSelfie}
                      disabled={!cameraReady || cameraError}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      <span>Capture</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary max-w-md mx-auto">
                    <img src={selfieImage} alt="Selfie" className="w-full h-auto" />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={retakeSelfie}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all"
                    >
                      Retake
                    </button>
                    <button
                      onClick={submitVerification}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">verified_user</span>
                      <span>Verify Identity</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Processing...</h1>
                <p className="text-gray-400">AI is verifying your identity</p>
              </div>

              {/* 3D Animation */}
              <div className="h-64 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                <ScanningAnimation isScanning={true} />
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-primary font-bold">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-orange-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="text-center text-sm space-y-1">
                {processingStage ? (
                  <p className="text-primary font-medium">{processingStage}</p>
                ) : (
                  <>
                    <p className="text-gray-400">Extracting document data...</p>
                    <p className="text-gray-400">Detecting faces...</p>
                    <p className="text-gray-400">Matching biometric features...</p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 'result' && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Match Score */}
              <div className="text-center">
                <div className="relative size-40 mx-auto mb-4">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      className="text-primary drop-shadow-[0_0_4px_rgba(255,121,26,0.6)]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${(result.faceMatch?.match_score || 0) * 100}, 100`}
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-4xl font-bold text-white">
                      {Math.round((result.faceMatch?.match_score || 0) * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Match</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {result.faceMatch?.is_match ? 'Identity Verified ✓' : 'Match Failed'}
                </h2>
                <p className="text-gray-400">
                  {result.faceMatch?.is_match 
                    ? 'Your identity has been successfully verified'
                    : 'Face does not match the document'}
                </p>
              </div>

              {/* Document Data */}
              {result.documentData && (
                <div className="bg-surface-dark rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Extracted Information</h3>
                  <div className="space-y-3">
                    {Object.entries(result.documentData.extracted_text || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-white font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Face Match Details */}
              <div className="bg-surface-dark rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Verification Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Face Detected</span>
                    <span className={`flex items-center gap-2 ${result.faceMatch?.face_detected ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="material-symbols-outlined text-sm">
                        {result.faceMatch?.face_detected ? 'check_circle' : 'cancel'}
                      </span>
                      {result.faceMatch?.face_detected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Confidence Score</span>
                    <span className="text-white font-medium">
                      {Math.round((result.faceMatch?.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Liveness Check</span>
                    <span className="text-green-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Passed
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={startOver}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all"
              >
                Verify Another ID
              </button>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IDVerificationPage;
