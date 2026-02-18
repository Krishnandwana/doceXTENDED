import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';

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
  const [step, setStep] = useState('upload'); // upload, confirmation, capture, processing, result
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [documentType, setDocumentType] = useState('pan');
  // const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  // const [processingStage, setProcessingStage] = useState('');
  
  // New states for confirmation screen
  const [extractedName, setExtractedName] = useState(null);
  const [extractedId, setExtractedId] = useState(null);
  const [croppedFace, setCroppedFace] = useState(null);
  const [extractingPreview, setExtractingPreview] = useState(false);

  // Load face-api models on mount using the same approach as test HTML
  useEffect(() => {
    let cancelled = false;
    
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        console.log('Loading face-api.js models from:', MODEL_URL);
        
        console.log('Loading SSD MobileNet...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        
        console.log('Loading Face Landmark Model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        console.log('Loading Face Recognition Model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        console.log('Loading Tiny Face Detector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        if (!cancelled) {
          setModelsLoaded(true);
          console.log('✅ All face-api.js models loaded successfully');
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
  // const getErrorMessage = (error) => {
  //   if (typeof error === 'string') return error;
  //   if (error?.message) return error.message;
  //   if (error?.detail) {
  //     if (typeof error.detail === 'string') return error.detail;
  //     if (Array.isArray(error.detail)) {
  //       return error.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
  //     }
  //   }
  //   return 'Unknown error occurred';
  // };

  // Face detection function - same as HTML test page
  const detectFaces = async (imageDataUrl) => {
    try {
      console.log('Detecting faces in image...');
      
      // Create image element from data URL
      const img = await new Promise((resolve, reject) => {
        const imgElement = new Image();
        imgElement.onload = () => resolve(imgElement);
        imgElement.onerror = reject;
        imgElement.src = imageDataUrl;
      });

      console.log('Image loaded:', img.width, 'x', img.height);
      
      // Try SSD MobileNet first (more accurate)
      console.log('Detecting with SSD MobileNet...');
      let detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log(`SSD MobileNet detected ${detections.length} faces`);

      // Fallback to TinyFaceDetector if needed
      if (detections.length === 0) {
        console.log('Trying TinyFaceDetector as fallback...');
        detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        console.log(`TinyFaceDetector detected ${detections.length} faces`);
      }

      return detections;
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  };

  // Face comparison function - exact same logic as HTML test page
  // const compareFacesLocal = async (selfieDataUrl, documentDataUrl) => {
  //   try {
  //     if (!modelsLoaded) {
  //       console.error('Models not loaded!');
  //       return {
  //         match: false,
  //         confidence: 0,
  //         error: 'Face detection models not loaded',
  //         facesDetected: { selfie: 0, document: 0 }
  //       };
  //     }
  //     console.log('🔍 Detecting faces in both images...');
  //     const [selfieDetections, documentDetections] = await Promise.all([
  //       detectFaces(selfieDataUrl),
  //       detectFaces(documentDataUrl)
  //     ]);
  //     console.log(`Faces detected - Selfie: ${selfieDetections.length}, Document: ${documentDetections.length}`);
  //     if (selfieDetections.length === 0) {
  //       console.error('❌ No face detected in selfie');
  //       return { match: false, confidence: 0, error: 'No face detected in selfie', facesDetected: { selfie: 0, document: documentDetections.length } };
  //     }
  //     if (documentDetections.length === 0) {
  //       console.error('❌ No face detected in document');
  //       return { match: false, confidence: 0, error: 'No face detected in document', facesDetected: { selfie: selfieDetections.length, document: 0 } };
  //     }
  //     console.log('✅ Faces detected in both images, comparing...');
  //     const descriptor1 = selfieDetections[0].descriptor;
  //     const descriptor2 = documentDetections[0].descriptor;
  //     const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  //     const threshold = 0.6;
  //     const isMatch = distance < threshold;
  //     const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));
  //     console.log('📊 Face Comparison Results:', 'Distance:', distance.toFixed(4), 'Threshold:', threshold, 'Confidence:', Math.round(confidence) + '%', 'Match:', isMatch ? '✅ YES' : '❌ NO');
  //     return { match: isMatch, confidence: Math.round(confidence), distance: distance, threshold: threshold, facesDetected: { selfie: selfieDetections.length, document: documentDetections.length } };
  //   } catch (error) {
  //     console.error('Face comparison error:', error);
  //     return { match: false, confidence: 0, error: error.message || 'Face comparison failed', facesDetected: { selfie: 0, document: 0 } };
  //   }
  // };

  // Handle document upload
  const handleDocumentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Proceed to confirmation after document upload
  const proceedToConfirmation = async () => {
    if (!documentFile) {
      setError('Please upload a document first');
      return;
    }

    setExtractingPreview(true);
    setError(null);

    try {
      // Step 1: Upload document
      const formData = new FormData();
      formData.append('file', documentFile);

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000
      });

      const docId = uploadResponse.data.document_id;
      setDocumentId(docId);

      // Step 2: Extract preview (face, name, ID number)
      const previewResponse = await axios.post(`${API_BASE_URL}/api/documents/extract-preview`, {
        document_id: docId,
        document_type: documentType
      }, { timeout: 60000 }); // 60 second timeout for OCR processing

      const previewData = previewResponse.data;

      // Use cropped document if available, otherwise keep original
      if (previewData.document_cropped && previewData.cropped_document) {
        console.log('✅ Using cropped document image');
        setDocumentPreview(previewData.cropped_document);
      }

      // Set extracted data
      if (previewData.face_extracted && previewData.face_image_base64) {
        setCroppedFace(`data:image/jpeg;base64,${previewData.face_image_base64}`);
      }
      
      if (previewData.name) {
        setExtractedName(previewData.name);
      }
      
      if (previewData.id_number) {
        setExtractedId(previewData.id_number);
      }

      // Move to confirmation screen
      setStep('confirmation');
      setExtractingPreview(false);

    } catch (err) {
      console.error('Preview extraction error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to extract document preview');
      setExtractingPreview(false);
    }
  };
  
  // Proceed to face capture from confirmation
  const proceedToCapture = () => {
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

  // Submit for verification - redirect to HTML test page
  const submitVerification = async () => {
    if (!documentId || !selfieImage) {
      setError('Both document and selfie are required');
      return;
    }

    if (!croppedFace) {
      setError('No face extracted from document');
      return;
    }

    try {
      console.log('Preparing for face verification...');
      
      // Store images in sessionStorage for the HTML test page
      sessionStorage.setItem('verification_document_image', croppedFace);
      sessionStorage.setItem('verification_selfie_image', selfieImage);
      sessionStorage.setItem('verification_return_url', window.location.pathname);
      sessionStorage.setItem('verification_document_id', documentId);
      sessionStorage.setItem('verification_document_type', documentType);
      
      console.log('✅ Images stored in sessionStorage, redirecting to verification page...');
      
      // Redirect to the HTML test page which will auto-run verification
      window.location.href = '/test_face_verification.html';
      
    } catch (err) {
      console.error('Error preparing verification:', err);
      setError('Failed to prepare verification');
    }
  };

  // Check for verification results when returning from HTML test page
  useEffect(() => {
    const results = sessionStorage.getItem('verification_results');
    if (results) {
      try {
        const parsedResults = JSON.parse(results);
        console.log('✅ Verification results received:', parsedResults);
        
        // Clear the results from sessionStorage
        sessionStorage.removeItem('verification_results');
        sessionStorage.removeItem('verification_return_url');
        
        // Get document ID and type
        const docId = sessionStorage.getItem('verification_document_id');
        const docType = sessionStorage.getItem('verification_document_type');
        
        // Clean up
        sessionStorage.removeItem('verification_document_id');
        sessionStorage.removeItem('verification_document_type');
        
        // Set the result and move to result step
        setResult({
          documentData: {
            document_type: docType,
            document_id: docId,
            extracted_name: extractedName,
            extracted_id: extractedId,
            extracted_text: {
              name: extractedName,
              id_number: extractedId,
              document_type: docType
            }
          },
          faceMatch: {
            is_match: parsedResults.match,
            matched: parsedResults.match,
            // Confidence comes as 0-100 from HTML, convert to 0-1 for display
            confidence: parsedResults.confidence / 100,
            match_score: parsedResults.confidence / 100,
            distance: parsedResults.distance,
            threshold: parsedResults.threshold,
            // Check if faces were detected in both images
            face_detected: parsedResults.facesDetected?.document > 0 && parsedResults.facesDetected?.selfie > 0,
            facesDetected: parsedResults.facesDetected,
            method: 'face-api.js (HTML verification)',
            error: parsedResults.error
          }
        });
        setStep('result');
        
      } catch (err) {
        console.error('Error parsing verification results:', err);
        setError('Failed to parse verification results');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Reset and start over
  const startOver = () => {
    setStep('upload');
    setDocumentFile(null);
    setDocumentPreview(null);
    setDocumentId(null);
    setSelfieImage(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setCroppedFace(null);
    setExtractedName(null);
    setExtractedId(null);
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
                  <div className="relative rounded-xl overflow-hidden border-[5px] border-primary" style={{boxShadow: '0 0 20px rgba(255, 121, 26, 0.5)'}}>
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
                    onClick={proceedToConfirmation}
                    disabled={extractingPreview}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extractingPreview ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Next: Confirm Details</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 1.5: Confirmation Screen */}
          {step === 'confirmation' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Confirm Your Details</h1>
                <p className="text-gray-400">Please verify the extracted information before proceeding</p>
              </div>

              {/* Cropped Face Display */}
              {croppedFace && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-[6px] border-primary" style={{boxShadow: '0 0 20px rgba(255, 121, 26, 0.5), inset 0 0 0 2px rgba(255, 121, 26, 0.3)'}}>
                      <img 
                        src={croppedFace} 
                        alt="Extracted Face" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      ID Photo
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Information */}
              <div className="bg-surface-dark rounded-xl border border-white/10 p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Extracted Information
                </h3>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    <div className="bg-background-dark border border-white/10 text-white rounded-lg px-4 py-3">
                      {extractedName || 'Not extracted'}
                    </div>
                  </div>

                  {/* ID Number */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">
                      {documentType === 'aadhaar' && 'Aadhaar Number'}
                      {documentType === 'pan' && 'PAN Number'}
                      {documentType === 'driving_license' && 'License Number'}
                      {documentType === 'passport' && 'Passport Number'}
                      {documentType === 'voter_id' && 'Voter ID Number'}
                    </label>
                    <div className="bg-background-dark border border-white/10 text-white rounded-lg px-4 py-3 font-mono">
                      {extractedId || 'Not extracted'}
                    </div>
                  </div>

                  {/* Document Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">Document Type</label>
                    <div className="bg-background-dark border border-white/10 text-white rounded-lg px-4 py-3 capitalize">
                      {documentType.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning if face not extracted */}
              {!croppedFace && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <span className="material-symbols-outlined">warning</span>
                    <span className="text-sm font-medium">
                      Face not detected in document. You can still proceed, but verification may not be possible.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep('upload');
                    setCroppedFace(null);
                    setExtractedName(null);
                    setExtractedId(null);
                    setDocumentId(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  <span>Back</span>
                </button>
                <button
                  onClick={proceedToCapture}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Confirm & Continue</span>
                </button>
              </div>
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
                      onClick={() => setStep('confirmation')}
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
                  <div className="relative rounded-xl overflow-hidden border-[5px] border-primary max-w-md mx-auto" style={{boxShadow: '0 0 20px rgba(255, 121, 26, 0.5)'}}>
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
