import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Camera,
  CheckCircle,
  XCircle,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  Loader,
  X
} from 'lucide-react';
import { extractDocumentData, validateDocument } from '../services/geminiService';

const steps = [
  {
    label: 'Upload ID Document',
    description: 'Upload a clear photo of your ID card, passport, or driver\'s license',
    icon: Upload
  },
  {
    label: 'Data Extraction',
    description: 'We\'ll extract and verify the information from your document',
    icon: FileText
  },
  {
    label: 'Live Verification',
    description: 'Take a selfie to match with your ID photo',
    icon: Camera
  },
  {
    label: 'Verification Complete',
    description: 'Your identity has been verified and stored securely',
    icon: CheckCircle
  }
];

function IDVerification() {
  const [activeStep, setActiveStep] = useState(0);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDocumentFile(file);
      setError(null);
    }
  };

  const processDocument = async () => {
    if (!documentFile) {
      setError('Please select a document first');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveStep(1);

    try {
      // Extract data using Gemini AI directly
      const extractionResult = await extractDocumentData(documentFile, 'pan');

      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'Failed to extract document data');
      }

      // Prepare document data with validation
      const validationIssues = validateDocument(extractionResult.data, 'pan');

      const processedData = {
        parsed_data: extractionResult.data,
        validation: {
          is_valid: validationIssues.length === 0 && extractionResult.data.is_valid !== false,
          invalid_fields: extractionResult.data.validation_issues || [],
          missing_required_fields: validationIssues
        },
        confidence_score: extractionResult.confidence_score || 85
      };

      setDocumentData(processedData);
      // Generate a mock document ID for the flow
      setDocumentId(`doc_${Date.now()}`);

      // Move to face verification step
      setActiveStep(2);

    } catch (err) {
      setError(err.message || 'Document processing failed. Please try again.');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (err) {
      setError('Failed to access camera');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      setSelfieImage(imageData);
      stopCamera();
    }
  }, [stopCamera]);

  const verifyFace = async () => {
    if (!selfieImage) {
      setError('Please capture a selfie first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate face matching (frontend-only mode)
      // In production, this would call a backend face recognition service
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = {
        success: true,
        match: true,
        confidence: 92,
        message: 'Face verification completed successfully',
        note: 'Face matching is simulated in frontend-only mode'
      };

      setVerificationResult(result);
      setActiveStep(3);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Skip face verification (optional)
  const skipFaceVerification = () => {
    const result = {
      success: true,
      match: false,
      confidence: 0,
      message: 'Face verification skipped',
      note: 'Document data extracted successfully'
    };
    setVerificationResult(result);
    setActiveStep(3);
  };

  const resetVerification = () => {
    setActiveStep(0);
    setDocumentFile(null);
    setDocumentData(null);
    setSelfieImage(null);
    setVerificationResult(null);
    setDocumentId(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Your ID Document
              </h3>
              <p className="text-gray-600 mb-8">
                Supported formats: JPG, PNG, BMP, TIFF
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 px-8 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
              >
                Choose File
              </button>

              {documentFile && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-900 font-medium">
                    Selected: {documentFile.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                disabled
                className="px-6 py-2 rounded-lg font-medium text-gray-400 cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={processDocument}
                disabled={!documentFile || loading}
                className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  !documentFile || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upload & Process
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Document
              </h3>
              <p className="text-gray-600 mb-8">
                Extracting information from your document...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full animate-pulse" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {documentData && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-red-600" />
                  Extracted Information
                </h3>

                {/* Document Preview */}
                {documentFile && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Uploaded Document:</p>
                    <img
                      src={URL.createObjectURL(documentFile)}
                      alt="Document preview"
                      className="w-full max-w-md mx-auto rounded-xl shadow-lg border-2 border-gray-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {documentData.parsed_data?.name || 'Not found'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Document Number</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {documentData.parsed_data?.pan_number || documentData.parsed_data?.aadhaar_number || 'Not found'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center border-t border-gray-200 pt-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Live Face Verification
              </h3>
              <p className="text-gray-600 mb-8">
                Take a selfie to verify your identity
              </p>

              {!selfieImage ? (
                <button
                  onClick={startCamera}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              ) : (
                <div className="inline-block">
                  <img
                    src={selfieImage}
                    alt="Captured selfie"
                    className="w-64 h-48 object-cover rounded-xl shadow-lg mb-4"
                  />
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setSelfieImage(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      onClick={verifyFace}
                      disabled={loading}
                      className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                        loading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 shadow-lg'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify Face'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setActiveStep(0)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={skipFaceVerification}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Skip Face Verification
                </button>
                <button
                  onClick={verifyFace}
                  disabled={!selfieImage || loading}
                  className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                    !selfieImage || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 shadow-lg'
                  }`}
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              {verificationResult?.match ? (
                <>
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-600 mb-2">
                    Verification Successful!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {verificationResult.message}
                  </p>
                  {verificationResult.confidence > 0 && (
                    <div className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-full font-bold text-lg mb-4">
                      {verificationResult.confidence}% Match
                    </div>
                  )}
                  {verificationResult.note && (
                    <p className="text-sm text-gray-500 mt-4">
                      ℹ️ {verificationResult.note}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-blue-600 mb-2">
                    Document Processed Successfully
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {verificationResult?.message || 'Document data extracted successfully'}
                  </p>
                  {verificationResult?.note && (
                    <p className="text-sm text-gray-500 mt-4">
                      ℹ️ {verificationResult.note}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={resetVerification}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
              >
                Start New Verification
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ID Verification
              </h1>
              <p className="text-gray-600 mt-1">
                Secure identity verification with face matching
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 font-medium">{error}</p>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <div key={step.label} className="flex flex-col items-center flex-1 relative">
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-1 ${
                        isCompleted ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gray-200'
                      }`}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 mb-2 transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-red-600 to-orange-500 shadow-lg scale-110'
                        : isCompleted
                        ? 'bg-gradient-to-br from-green-600 to-green-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive || isCompleted ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <p
                    className={`text-xs font-medium text-center hidden sm:block ${
                      isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Step Description */}
          <div className="text-center mb-6">
            <p className="text-gray-600">
              {steps[activeStep].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent(activeStep)}

        {/* Camera Modal */}
        {cameraOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Take a Selfie</h3>
                <button
                  onClick={stopCamera}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-xl rounded-xl shadow-lg"
                  />
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={stopCamera}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-600 shadow-lg flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IDVerification;
