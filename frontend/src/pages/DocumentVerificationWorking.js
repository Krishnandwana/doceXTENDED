import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 3D Document Scanner Component
function DocumentScanner({ isScanning, progress }) {
  const meshRef = React.useRef();
  const scanLineRef = React.useRef();

  useFrame((state) => {
    if (meshRef.current && isScanning) {
      meshRef.current.rotation.y += 0.01;
    }
    if (scanLineRef.current && isScanning) {
      scanLineRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 1.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[0, 5, 0]} angle={0.3} penumbra={1} intensity={1} color="#ff791a" />
      
      <OrbitControls enableZoom={false} autoRotate={isScanning} autoRotateSpeed={1} />
      
      {/* Document representation */}
      <Box ref={meshRef} args={[2, 2.8, 0.05]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#ff791a"
          wireframe={isScanning}
          opacity={0.8}
          transparent
          emissive="#ff791a"
          emissiveIntensity={isScanning ? 0.5 : 0}
        />
      </Box>

      {/* Scan line */}
      {isScanning && (
        <Box ref={scanLineRef} args={[2.2, 0.02, 0.1]} position={[0, 0, 0.1]}>
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </Box>
      )}

      {/* Data points */}
      {isScanning && progress > 30 && (
        <>
          <Sphere args={[0.05, 16, 16]} position={[-0.8, 0.8, 0.1]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
          </Sphere>
          <Sphere args={[0.05, 16, 16]} position={[0.8, 0.8, 0.1]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
          </Sphere>
          <Sphere args={[0.05, 16, 16]} position={[-0.8, -0.8, 0.1]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
          </Sphere>
          <Sphere args={[0.05, 16, 16]} position={[0.8, -0.8, 0.1]}>
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
          </Sphere>
        </>
      )}
    </>
  );
}

const DocumentVerificationWorking = () => {
  const navigate = useNavigate();
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const documentType = 'id_card';
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // upload, processing, result
  const [processingStage, setProcessingStage] = useState('');

  // Handle file selection
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, BMP)');
        return;
      }

      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload({ target: { files: [file] } });
    }
  }, [handleFileUpload]);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Submit for processing
  const submitDocument = async () => {
    if (!documentFile) {
      setError('Please select a document first');
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Upload document
      setProcessingStage('Uploading document...');
      setProgress(5);
      const formData = new FormData();
      formData.append('file', documentFile);

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const documentId = uploadResponse.data.document_id;
      setProgress(15);

      // Step 2: Check authenticity (AI-generated detection)
      setProcessingStage('🔍 Analyzing document authenticity...');
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Smooth animation
      
      const authenticityResponse = await axios.post(
        `${API_BASE_URL}/api/documents/${documentId}/authenticity`
      );
      
      setProgress(35);

      // Step 3: Validate document quality
      setProcessingStage('🔬 Validating document quality...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      setProgress(45);
      
      const validationResponse = await axios.post(
        `${API_BASE_URL}/api/documents/${documentId}/validate-authenticity?document_type=${documentType}`
      );
      setProgress(55);

      // Step 4: Start OCR processing
      setProcessingStage('📄 Extracting text with AI...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processResponse = await axios.post(
        `${API_BASE_URL}/api/documents/${documentId}/process`,
        {
          document_type: documentType,
          use_gemini: true
        }
      );

      const jobId = processResponse.data.job_id;
      setProgress(65);

      // Step 5: Poll for results
      setProcessingStage('🤖 AI is processing your document...');
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusResponse = await axios.get(`${API_BASE_URL}/api/processing/${jobId}/status`);
          const status = statusResponse.data;

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setProcessingStage('✅ Finalizing results...');
            setProgress(95);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Combine results
            const finalResult = {
              ...status.result,
              authenticity: authenticityResponse.data,
              validation: validationResponse.data.validation
            };
            
            setResult(finalResult);
            setProgress(100);
            setStep('result');
            setIsProcessing(false);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(status.message || 'Processing failed');
          } else if (status.status === 'processing') {
            const baseProgress = 65 + (attempts * 1.5);
            setProgress(Math.min(baseProgress, 90));
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error('Processing timeout. Please try again.');
          }
        } catch (err) {
          clearInterval(pollInterval);
          throw err;
        }
      }, 2000);

    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.detail || err.message || 'Processing failed');
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
          <h2 className="text-white text-lg font-bold tracking-tight">Document Verification</h2>
          <button 
            onClick={() => navigate('/pipeline')}
            className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">analytics</span>
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
                <h1 className="text-2xl font-bold text-white mb-2">Upload Document</h1>
                <p className="text-gray-400">Upload your document for AI-powered verification</p>
              </div>

              {/* Upload Area */}
              {!documentPreview ? (
                <label
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-surface-dark/50 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-surface-dark cursor-pointer"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-6xl">cloud_upload</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Document</h3>
                  <p className="text-sm text-gray-400 mb-4">Click to browse or drag and drop</p>
                  <p className="text-xs text-gray-500">JPEG, PNG, BMP • Max 10MB</p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img 
                      src={documentPreview} 
                      alt="Document preview" 
                      className="w-full h-auto max-h-96 object-contain mx-auto"
                    />
                    <button
                      onClick={() => {
                        setDocumentFile(null);
                        setDocumentPreview(null);
                      }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined">description</span>
                        <span className="text-sm font-medium">{documentFile?.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={submitDocument}
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20"
                  >
                    <span className="material-symbols-outlined">fact_check</span>
                    <span>Analyze Document</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">🤖 AI Analysis in Progress</h1>
                <p className="text-gray-400">{processingStage || 'Processing document...'}</p>
              </div>

              {/* 3D Scanner Animation */}
              <div className="h-80 rounded-xl overflow-hidden bg-black/40 border border-primary/30 shadow-[0_0_30px_rgba(255,121,26,0.3)]">
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                  <DocumentScanner isScanning={isProcessing} progress={progress} />
                </Canvas>
              </div>

              {/* Progress Bar with Glow */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">AI Processing</span>
                  <span className="text-primary font-bold">{progress}%</span>
                </div>
                <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-orange-500 to-orange-600 relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 animate-pulse opacity-50"></div>
                  </motion.div>
                  <div 
                    className="absolute h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan" 
                    style={{ width: '30%' }}
                  ></div>
                </div>
              </div>

              {/* Processing Stages */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border transition-all ${
                  progress >= 15 ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-surface-dark/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${
                      progress >= 15 ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {progress >= 15 ? 'check_circle' : 'pending'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">Upload</p>
                      <p className="text-xs text-gray-400">Document received</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all ${
                  progress >= 35 ? 'border-green-500/50 bg-green-500/10' : 
                  progress >= 15 ? 'border-primary/50 bg-primary/10 animate-pulse' : 
                  'border-white/10 bg-surface-dark/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${
                      progress >= 35 ? 'text-green-400' : 
                      progress >= 15 ? 'text-primary animate-spin' : 'text-gray-500'
                    }`}>
                      {progress >= 35 ? 'check_circle' : progress >= 15 ? 'sync' : 'pending'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">Authenticity</p>
                      <p className="text-xs text-gray-400">AI detection</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all ${
                  progress >= 55 ? 'border-green-500/50 bg-green-500/10' : 
                  progress >= 35 ? 'border-primary/50 bg-primary/10 animate-pulse' : 
                  'border-white/10 bg-surface-dark/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${
                      progress >= 55 ? 'text-green-400' : 
                      progress >= 35 ? 'text-primary animate-spin' : 'text-gray-500'
                    }`}>
                      {progress >= 55 ? 'check_circle' : progress >= 35 ? 'sync' : 'pending'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">Validation</p>
                      <p className="text-xs text-gray-400">Quality check</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all ${
                  progress >= 95 ? 'border-green-500/50 bg-green-500/10' : 
                  progress >= 55 ? 'border-primary/50 bg-primary/10 animate-pulse' : 
                  'border-white/10 bg-surface-dark/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${
                      progress >= 95 ? 'text-green-400' : 
                      progress >= 55 ? 'text-primary animate-spin' : 'text-gray-500'
                    }`}>
                      {progress >= 95 ? 'check_circle' : progress >= 55 ? 'sync' : 'pending'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">OCR</p>
                      <p className="text-xs text-gray-400">Text extraction</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  <span>AI Engine Processing...</span>
                </div>
                <p className="text-gray-500 text-xs">Powered by Gemini AI</p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 'result' && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Success Header */}
              <div className="text-center bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/20 rounded-xl p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <span className="material-symbols-outlined text-green-400 text-4xl">verified</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">✅ Analysis Complete</h1>
                <p className="text-gray-400">Document verification results</p>
              </div>

              {/* Authenticity Status */}
              {result.authenticity && (
                <div className={`p-6 rounded-xl border-2 ${
                  result.authenticity.is_authentic 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-red-500/50 bg-red-500/10'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      result.authenticity.is_authentic ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <span className={`material-symbols-outlined text-3xl ${
                        result.authenticity.is_authentic ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.authenticity.is_authentic ? 'verified' : 'dangerous'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 ${
                        result.authenticity.is_authentic ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.authenticity.is_authentic 
                          ? '✅ Document is Authentic' 
                          : '⚠️ Document May Be Invalid'}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {result.authenticity.explanation || 'AI analysis completed'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Confidence Score</p>
                          <p className="text-xl font-bold text-white">
                            {result.authenticity.confidence_score}%
                          </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">AI Generated</p>
                          <p className={`text-xl font-bold ${
                            result.authenticity.is_ai_generated ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {result.authenticity.is_ai_generated ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Validation */}
              {result.validation && (
                <div className="bg-surface-dark rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">fact_check</span>
                    Quality Assessment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <span className="text-sm text-gray-400">Image Clear</span>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        result.validation.is_clear ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {result.validation.is_clear ? 'check_circle' : 'cancel'}
                        </span>
                        {result.validation.is_clear ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <span className="text-sm text-gray-400">Appears Genuine</span>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        result.validation.appears_genuine ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {result.validation.appears_genuine ? 'check_circle' : 'cancel'}
                        </span>
                        {result.validation.appears_genuine ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <span className="text-sm text-gray-400">Tampering</span>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        !result.validation.tampering_detected ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {!result.validation.tampering_detected ? 'check_circle' : 'warning'}
                        </span>
                        {result.validation.tampering_detected ? 'Detected' : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <span className="text-sm text-gray-400">Format Valid</span>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        result.validation.format_valid ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {result.validation.format_valid ? 'check_circle' : 'cancel'}
                        </span>
                        {result.validation.format_valid ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  {result.validation.notes && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-400">
                        <span className="font-semibold">Notes:</span> {result.validation.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Information */}
              <div className="bg-surface-dark rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">text_snippet</span>
                  Extracted Information
                </h3>
                <div className="space-y-3">
                  {result.extracted_text && Object.entries(result.extracted_text).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                      <span className="text-gray-400 capitalize text-sm font-medium">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-white text-right text-sm max-w-[60%]">
                        {value || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startOver}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  <span>Verify Another</span>
                </button>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(result, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `document-verification-${Date.now()}.json`;
                    link.click();
                  }}
                  className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Export Results</span>
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DocumentVerificationWorking;
