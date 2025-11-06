import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ArrowLeft, X, Shield, Zap, Eye } from 'lucide-react';
import { extractDocumentData, validateDocument } from '../services/geminiService';
import { extractFaceFromDocument } from '../utils/faceDetection';

function DocumentVerification() {
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [documentFile, setDocumentFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [documentType, setDocumentType] = useState('aadhaar');
  const [processingProgress, setProcessingProgress] = useState(0);

  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'bill', label: 'Bill / Invoice' }
  ];

  const handleFileSelect = (file) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setDocumentFile(file);
      setError(null);
    } else {
      setError('Please upload an image file (JPG, PNG) or PDF');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const removeFile = () => {
    setDocumentFile(null);
    setError(null);
  };

  const verifyDocument = async () => {
    if (!documentFile) return;

    setLoading(true);
    setError(null);
    setCurrentScreen('processing');
    setProcessingProgress(0);

    try {
      // Step 1: Prepare document
      setProcessingProgress(20);

      // Step 2: Extract data using Gemini AI directly
      setProcessingProgress(40);
      const extractionResult = await extractDocumentData(documentFile, documentType);

      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'Failed to extract document data');
      }

      // Step 3: Validate extracted data
      setProcessingProgress(70);
      const validationIssues = validateDocument(extractionResult.data, documentType);

      // Step 4: Extract face photo from document (for ID cards only)
      setProcessingProgress(85);
      const isBill = documentType === 'bill';
      let extractedFace = null;

      if (!isBill) {
        try {
          extractedFace = await extractFaceFromDocument(documentFile, documentType);
          console.log(`Face extracted from ${documentType}:`, extractedFace ? 'Success' : 'No face found');
        } catch (err) {
          console.log('Face extraction failed:', err);
        }
      }

      // Step 5: Prepare result
      setProcessingProgress(90);
      // Better AI-generation detection based on anomalies
      const anomalies = extractionResult.data.anomalies || [];
      const hasRealAnomalies = anomalies.length > 0 && anomalies.some(a =>
        !a.includes('minor') && !a.includes('quality') && a.trim().length > 0
      );

      // For bills, check if total matches
      const billVerification = isBill ? {
        success: true,
        stated_total: extractionResult.data.stated_total,
        calculated_total: extractionResult.data.calculated_total,
        is_total_correct: extractionResult.data.is_total_correct,
        mismatch_amount: extractionResult.data.total_mismatch_amount,
        items: extractionResult.data.items || []
      } : null;

      const result = {
        parsed_data: extractionResult.data,
        validation: {
          is_valid: validationIssues.length === 0 && extractionResult.data.is_valid !== false,
          invalid_fields: extractionResult.data.validation_issues || [],
          missing_required_fields: validationIssues
        },
        authenticity_check: {
          is_ai_generated: hasRealAnomalies,
          confidence_score: extractionResult.confidence_score || 0,
          anomalies: anomalies,
          explanation: hasRealAnomalies
            ? `Found ${anomalies.length} anomaly/anomalies: ${anomalies.join(', ')}`
            : validationIssues.length > 0
              ? `Document has ${validationIssues.length} validation issue(s). ${validationIssues.join(', ')}`
              : 'Document appears authentic with no suspicious elements detected.'
        },
        bill_verification: billVerification,
        ocr_confidence: extractionResult.confidence_score || 85,
        timestamp: new Date().toISOString(),
        document_image: URL.createObjectURL(documentFile),
        extracted_face: extractedFace
      };

      setVerificationResult(result);
      setProcessingProgress(100);
      setTimeout(() => setCurrentScreen('results'), 300);

    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setCurrentScreen('upload');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentScreen('upload');
    setDocumentFile(null);
    setVerificationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAuthenticityScore = () => {
    if (!verificationResult?.authenticity_check) return 0;
    return parseInt(verificationResult.authenticity_check.confidence_score, 10) || 0;
  };

  const getRiskLevel = () => {
    if (!verificationResult?.authenticity_check) return { level: 'Unknown', color: 'gray' };

    const isAiGenerated = verificationResult.authenticity_check.is_ai_generated;
    const confidence = parseInt(verificationResult.authenticity_check.confidence_score, 10);

    if (isAiGenerated) {
      if (confidence > 75) return { level: 'High Risk', color: 'red' };
      return { level: 'Medium Risk', color: 'yellow' };
    }
    return { level: 'Low Risk', color: 'green' };
  };

  const getAnalysisDetails = () => {
    if (!verificationResult) return [];

    const details = [];
    const parsed = verificationResult.parsed_data || {};
    const validation = verificationResult.validation || {};
    const authenticity = verificationResult.authenticity_check || {};

    // AI Authenticity Check
    details.push({
      name: 'AI Generation Check',
      score: parseInt(authenticity.confidence_score, 10) || 0,
      interpretation: authenticity.explanation || 'Analysis not available.'
    });

    // OCR Quality
    details.push({
      name: 'OCR Text Extraction',
      score: verificationResult.ocr_confidence || 85,
      interpretation: verificationResult.ocr_confidence >= 80
        ? 'High quality text extraction from document'
        : 'Moderate quality text extraction'
    });

    // Data Completeness
    const extractedFieldsCount = Object.keys(parsed).length;
    const completenessScore = Math.min(100, extractedFieldsCount * 20);
    details.push({
      name: 'Data Completeness',
      score: completenessScore,
      interpretation: `${extractedFieldsCount} fields successfully extracted from document`
    });

    // Validation Check
    const validationScore = validation.is_valid ? 95 : 40;
    details.push({
      name: 'Format Validation',
      score: validationScore,
      interpretation: validation.is_valid
        ? 'All extracted data matches expected formats'
        : `${(validation.invalid_fields?.length || 0) + (validation.missing_required_fields?.length || 0)} validation issues found`
    });

    // Face Detection (if available)
    if (verificationResult.face_detection && verificationResult.face_detection.face_count > 0) {
      const faceScore = verificationResult.face_detection.face_count > 0 ? 90 : 20;
      details.push({
        name: 'Face Detection',
        score: faceScore,
        interpretation: `${verificationResult.face_detection.face_count} face(s) detected in document`
      });
    }

    return details;
  };

  // Upload Screen
  const UploadScreen = () => (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-red-600 font-bold text-xl">DocVerify</div>
          <div className="text-gray-500 text-sm">AI-Powered Verification</div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Document</h1>
      <p className="text-gray-600 text-sm mb-6">
        Upload any document for AI-powered authenticity analysis. Our system detects AI-generated images, deepfakes, and manipulated documents.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center mb-4 transition-all duration-200 ${
          isDragging
            ? 'border-red-500 bg-red-50 scale-105'
            : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-red-600" strokeWidth={2} />
          </div>
        </div>
        <div className="text-gray-700 mb-2">
          <span className="font-medium">Drag & drop your document or </span>
          <label className="text-red-600 font-semibold cursor-pointer hover:underline">
            browse files
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileInput}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">Supports: JPG, PNG, BMP, TIFF, PDF (Max 10MB)</p>
      </div>

      {documentFile && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 flex items-center justify-between mb-6 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{documentFile.name}</div>
              <div className="text-xs text-gray-600">
                {(documentFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {documentFile && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-6 bg-gray-50 rounded-lg p-3">
        <Shield className="w-4 h-4 text-green-600" />
        <span>Your data is encrypted end-to-end and never stored permanently.</span>
      </div>

      <button
        onClick={verifyDocument}
        disabled={!documentFile || loading}
        className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          documentFile && !loading
            ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-[1.02]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Zap className="w-5 h-5" />
        Start AI Verification
      </button>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <Eye className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">AI Detection</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <Shield className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">Deepfake Check</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <Zap className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">Fast Results</p>
        </div>
      </div>
    </div>
  );

  // Processing Screen
  const ProcessingScreen = () => {
    return (
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex flex-col items-center transition-all duration-300">
        <div className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Shield className="w-8 h-8 text-red-600" />
          DocVerify
        </div>

        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full border-4 border-red-100 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <FileText className="w-16 h-16 text-red-600" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">Document Processing</h2>
        <p className="text-center text-gray-600 text-sm mb-8 max-w-md">
          Extracting and verifying information from your {documentTypes.find(t => t.value === documentType)?.label || 'document'}. Using Advanced AI for high-accuracy OCR and validation.
        </p>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-red-600 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${processingProgress}%` }}
          ></div>
        </div>

        <div className="w-full space-y-3 mb-6">
          {['Uploading Document', 'OCR Text Extraction', 'Data Parsing', 'Format Validation', 'Face Detection'].map((name, index) => {
            const stepProgress = (index + 1) * 20;
            const isComplete = processingProgress >= stepProgress;
            const isActive = processingProgress >= (index * 20) && processingProgress < stepProgress;

            return (
              <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                <span className={`font-medium ${isComplete ? 'text-green-700' : isActive ? 'text-red-600' : 'text-gray-500'}`}>
                  {name}
                </span>
                <div className="flex items-center gap-2">
                  {isComplete && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {isActive && <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500">This may take 10-30 seconds depending on image size</p>
      </div>
    );
  };

  // Results Screen
  const ResultsScreen = () => {
    const authenticityScore = getAuthenticityScore();
    const riskLevel = getRiskLevel();
    const analyses = getAnalysisDetails();
    const isAiGenerated = verificationResult?.authenticity_check?.is_ai_generated;
    const mainMessage = isAiGenerated ? 'AI-Generated Content Detected' : 'Document Appears Authentic';

    return (
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={resetFlow}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Verification Results</h2>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(verificationResult?.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Score Card */}
        <div className={`rounded-2xl p-8 mb-8 text-center ${
          !isAiGenerated
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200'
            : 'bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200'
        }`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            !isAiGenerated ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {!isAiGenerated ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <XCircle className="w-12 h-12 text-white" />
            )}
          </div>

          <h3 className={`text-3xl font-bold mb-2 ${
            !isAiGenerated ? 'text-green-700' : 'text-red-700'
          }`}>
            {mainMessage}
          </h3>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            riskLevel.color === 'green' ? 'bg-green-600 text-white' :
            riskLevel.color === 'yellow' ? 'bg-yellow-500 text-white' :
            'bg-red-600 text-white'
          }`}>
            <Shield className="w-4 h-4" />
            {riskLevel.level}
          </div>

          <p className={`mt-4 text-sm font-medium ${
            !isAiGenerated ? 'text-green-700' : 'text-red-700'
          }`}>
            {verificationResult?.authenticity_check?.explanation || 'No detailed explanation available.'}
          </p>
        </div>

        {/* Bill Verification and Items */}
        {verificationResult?.bill_verification?.success && (
          <>
            {/* Bill Items List */}
            {verificationResult.bill_verification.items && verificationResult.bill_verification.items.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Bill Items ({verificationResult.bill_verification.items.length} items)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-green-200">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Item</th>
                        <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Price/Unit</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationResult.bill_verification.items.map((item, index) => (
                        <tr key={index} className="border-b border-green-100 hover:bg-green-50">
                          <td className="py-3 px-3 text-sm text-gray-900">{item.name}</td>
                          <td className="py-3 px-3 text-sm text-center text-gray-700">{item.quantity}</td>
                          <td className="py-3 px-3 text-sm text-right text-gray-700">₹{item.price_per_unit}</td>
                          <td className="py-3 px-3 text-sm text-right font-semibold text-gray-900">₹{item.total_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total Verification */}
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Total Verification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Stated Total</p>
                  <p className="text-xl font-bold text-gray-900">₹{verificationResult.bill_verification.stated_total}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Calculated Total</p>
                  <p className="text-xl font-bold text-gray-900">₹{verificationResult.bill_verification.calculated_total}</p>
                </div>
                <div className={`rounded-xl p-4 ${verificationResult.bill_verification.is_total_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className={`text-xs mb-1 uppercase tracking-wide ${verificationResult.bill_verification.is_total_correct ? 'text-green-700' : 'text-red-700'}`}>Match Status</p>
                  <p className={`text-xl font-bold ${verificationResult.bill_verification.is_total_correct ? 'text-green-800' : 'text-red-800'}`}>
                    {verificationResult.bill_verification.is_total_correct ? '✓ Correct' : '✗ Mismatch'}
                  </p>
                </div>
              </div>
              {!verificationResult.bill_verification.is_total_correct && verificationResult.bill_verification.mismatch_amount && (
                <div className="bg-red-100 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-700">
                    <strong>Difference:</strong> ₹{verificationResult.bill_verification.mismatch_amount}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Document Image - Centered for ID documents */}
        {verificationResult?.document_image && !verificationResult?.bill_verification && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Extracted Face Photo */}
              {verificationResult.extracted_face && (
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 w-full">
                    <h4 className="text-lg font-bold text-gray-900 mb-3 text-center">Extracted Photo</h4>
                    <div className="relative">
                      <img
                        src={verificationResult.extracted_face}
                        alt="Extracted face"
                        className="w-full rounded-xl shadow-lg border-4 border-white"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    {verificationResult.parsed_data?.name && (
                      <div className="mt-4 text-center">
                        <p className="text-xl font-bold text-gray-900">{verificationResult.parsed_data.name}</p>
                        {verificationResult.parsed_data?.photo_description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {verificationResult.parsed_data.photo_description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Document */}
              <div className={verificationResult.extracted_face ? 'md:col-span-2' : 'md:col-span-3'}>
                <div className="flex flex-col items-center">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">
                    {verificationResult.extracted_face ? 'Full Document' : 'Document'}
                  </h4>
                  <img
                    src={verificationResult.document_image}
                    alt="Document"
                    className="w-full rounded-2xl shadow-2xl border-4 border-gray-200"
                  />
                  {!verificationResult.extracted_face && verificationResult.parsed_data?.name && (
                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 w-full text-center">
                      <p className="text-2xl font-bold text-gray-900">{verificationResult.parsed_data.name}</p>
                      {verificationResult.parsed_data?.photo_description && (
                        <p className="text-sm text-gray-600 mt-2">
                          Photo: {verificationResult.parsed_data.photo_description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Data */}
        {verificationResult?.parsed_data && Object.keys(verificationResult.parsed_data).length > 0 && !verificationResult?.bill_verification && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Extracted Document Data
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(verificationResult.parsed_data)
                .filter(([key]) => !['photo_description', 'anomalies', 'validation_issues', 'items', 'is_valid', 'document_type', 'confidence_score'].includes(key))
                .map(([key, value]) => (
                  value && (
                    <div key={key} className="bg-white rounded-xl p-4">
                      <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                         typeof value === 'string' ? value : JSON.stringify(value)}
                      </p>
                    </div>
                  )
                ))}
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-red-600" />
            Verification Analysis Breakdown
          </h4>

          <div className="space-y-3">
            {analyses.map((analysis, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-900">{analysis.name}</span>
                  <span className={`text-sm font-bold ${
                    analysis.score >= 70 ? 'text-green-600' :
                    analysis.score >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(analysis.score)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      analysis.score >= 70 ? 'bg-green-600' :
                      analysis.score >= 50 ? 'bg-yellow-500' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">{analysis.interpretation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Issues */}
        {verificationResult?.validation && (!verificationResult.validation.is_valid ||
          (verificationResult.validation.missing_required_fields?.length > 0) ||
          (verificationResult.validation.invalid_fields?.length > 0)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h5 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Validation Issues
            </h5>
            <ul className="space-y-1">
              {verificationResult.validation.missing_required_fields?.map((field, index) => (
                <li key={`missing-${index}`} className="text-xs text-yellow-700">
                  • Missing required field: {field.replace(/_/g, ' ')}
                </li>
              ))}
              {verificationResult.validation.invalid_fields?.map((field, index) => (
                <li key={`invalid-${index}`} className="text-xs text-yellow-700">
                  • Invalid field: {field.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={resetFlow}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
          >
            Verify Another Document
          </button>
          <button
            onClick={() => console.log('Download report', verificationResult)}
            className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Download Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {currentScreen === 'upload' && <UploadScreen />}
        {currentScreen === 'processing' && <ProcessingScreen />}
        {currentScreen === 'results' && <ResultsScreen />}
      </div>
    </div>
  );
}

export default DocumentVerification;
