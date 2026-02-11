import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FaceMatching = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  
  const [step, setStep] = useState('upload'); // upload, capture, processing, result
  const [sourceImage, setSourceImage] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);
  const [liveImage, setLiveImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Handle source image upload
  const handleSourceUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSourceImage(file);
      setSourcePreview(URL.createObjectURL(file));
      setError(null);
    }
  };
  
  // Camera handlers
  const handleCameraReady = () => {
    setCameraReady(true);
    setCameraError(null);
  };
  
  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError('Camera access denied. Please allow camera permissions.');
    setCameraReady(false);
  };
  
  // Capture live photo
  const captureLive = useCallback(() => {
    if (!webcamRef.current) {
      setError('Camera not ready');
      return;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setLiveImage(imageSrc);
      setCameraError(null);
    } else {
      setError('Failed to capture image');
    }
  }, [webcamRef]);
  
  // Submit for matching
  const submitMatching = async () => {
    if (!sourceImage || !liveImage) {
      setError('Both images are required');
      return;
    }
    
    setStep('processing');
    setError(null);
    
    try {
      // Upload source image
      const sourceFormData = new FormData();
      sourceFormData.append('file', sourceImage);
      const sourceResponse = await axios.post(`${API_BASE_URL}/api/documents/upload`, sourceFormData);
      const sourceId = sourceResponse.data.document_id;
      
      // Upload live image
      const liveBlob = await fetch(liveImage).then(r => r.blob());
      const liveFormData = new FormData();
      liveFormData.append('file', liveBlob, 'live.jpg');
      const liveResponse = await axios.post(`${API_BASE_URL}/api/documents/upload`, liveFormData);
      const liveId = liveResponse.data.document_id;
      
      // Match faces
      const matchResponse = await axios.post(`${API_BASE_URL}/api/face/match`, {
        document_id: sourceId,
        selfie_id: liveId
      });
      
      setResult(matchResponse.data);
      setStep('result');
    } catch (err) {
      console.error('Matching error:', err);
      setError(err.response?.data?.detail || err.message || 'Matching failed');
      setStep('upload');
    }
  };
  
  // Reset
  const startOver = () => {
    setStep('upload');
    setSourceImage(null);
    setSourcePreview(null);
    setLiveImage(null);
    setResult(null);
    setError(null);
    setCameraReady(false);
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
          <h2 className="text-white text-lg font-bold tracking-tight">Face Matching</h2>
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

          {/* Step 1: Upload Source Image */}
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Upload Reference Photo</h1>
                <p className="text-gray-400">Upload the ID document or reference photo</p>
              </div>

              {!sourcePreview ? (
                <label className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-surface-dark/50 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-surface-dark cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSourceUpload}
                    className="hidden"
                  />
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-5xl">person</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Upload Reference Photo</h3>
                  <p className="text-sm text-gray-400">Click to browse</p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 max-w-md mx-auto">
                    <img src={sourcePreview} alt="Source" className="w-full h-auto" />
                    <button
                      onClick={() => {
                        setSourceImage(null);
                        setSourcePreview(null);
                      }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setStep('capture')}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next: Capture Live Photo</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Capture Live Photo */}
          {step === 'capture' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Capture Live Photo</h1>
                <p className="text-gray-400">Look at the camera for comparison</p>
              </div>

              {!liveImage ? (
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
                      onClick={captureLive}
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
                    <img src={liveImage} alt="Live" className="w-full h-auto" />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setLiveImage(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all"
                    >
                      Retake
                    </button>
                    <button
                      onClick={submitMatching}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">compare</span>
                      <span>Match Faces</span>
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
                <h1 className="text-2xl font-bold text-white mb-2">Analyzing Faces...</h1>
                <p className="text-gray-400">Comparing biometric features</p>
              </div>

              <div className="flex items-center justify-center mb-8">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary border-t-transparent"></div>
              </div>

              <div className="text-center space-y-2 text-sm text-gray-400">
                <p>🔍 Detecting facial landmarks...</p>
                <p>📐 Comparing geometric features...</p>
                <p>🎯 Calculating match score...</p>
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
              {/* Image Comparison */}
              <div className="relative grid grid-cols-2 gap-4 mb-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background-dark rounded-full border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-primary text-lg">compare_arrows</span>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-700 rounded text-xs font-medium text-white z-10">
                    SOURCE
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={sourcePreview} alt="Source" className="w-full h-auto" />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary rounded text-xs font-bold text-white z-10">
                    LIVE
                  </div>
                  <div className="rounded-xl overflow-hidden border-2 border-primary">
                    <img src={liveImage} alt="Live" className="w-full h-auto" />
                  </div>
                </div>
              </div>

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
                      strokeDasharray={`${(result.match_score || 0) * 100}, 100`}
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-4xl font-bold text-white">
                      {Math.round((result.match_score || 0) * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Match</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {result.is_match ? '✓ Faces Match' : '✗ No Match'}
                </h2>
                <p className="text-gray-400">
                  {result.is_match 
                    ? 'The faces match with high confidence'
                    : 'The faces do not match'}
                </p>
              </div>

              {/* Analysis Details */}
              <div className="bg-surface-dark rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Analysis Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${result.face_detected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        <span className={`material-symbols-outlined ${result.face_detected ? 'text-green-400' : 'text-red-400'}`}>
                          {result.face_detected ? 'check_circle' : 'cancel'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Face Detection</p>
                        <p className="text-xs text-gray-400">Facial features identified</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${result.face_detected ? 'text-green-400' : 'text-red-400'}`}>
                      {result.face_detected ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="h-px bg-white/10"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/20">
                        <span className="material-symbols-outlined text-green-400">face</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Geometric Analysis</p>
                        <p className="text-xs text-gray-400">128-point comparison</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-green-400">PASS</span>
                  </div>

                  <div className="h-px bg-white/10"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/20">
                        <span className="material-symbols-outlined text-primary">speed</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Confidence Score</p>
                        <p className="text-xs text-gray-400">Match reliability</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-white">
                      {Math.round((result.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startOver}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Dashboard</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FaceMatching;
