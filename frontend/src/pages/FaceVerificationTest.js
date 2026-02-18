import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './FaceVerificationTest.css';

const FaceVerificationTest = () => {
  const [status, setStatus] = useState({ message: 'Loading models...', type: 'loading' });
  const [progress, setProgress] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [documentImage, setDocumentImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [testReady, setTestReady] = useState(false);

  const documentImgRef = useRef(null);
  const capturedImgRef = useRef(null);
  const documentCanvasRef = useRef(null);
  const capturedCanvasRef = useRef(null);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Check if ready to test
  useEffect(() => {
    if (modelsLoaded && documentImage && capturedImage) {
      setTestReady(true);
      setStatus({ message: '✅ Ready to test! Click button to compare faces.', type: 'match' });
    } else if (modelsLoaded) {
      setTestReady(false);
      const missing = [];
      if (!documentImage) missing.push('Document Image');
      if (!capturedImage) missing.push('Captured Image');
      if (missing.length > 0) {
        setStatus({ message: `⚠️ Please select ${missing.join(' and ')}`, type: 'loading' });
      }
    }
  }, [modelsLoaded, documentImage, capturedImage]);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      
      setProgress('Loading SSD MobileNet...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      
      setProgress('Loading Face Landmark Model...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      
      setProgress('Loading Face Recognition Model...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      
      setProgress('Loading Tiny Face Detector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      setModelsLoaded(true);
      setProgress('Models loaded! Now select two images to compare.');
      
      console.log('✅ All models loaded successfully');
    } catch (error) {
      setStatus({ message: `❌ Failed to load models: ${error.message}`, type: 'no-match' });
      console.error('Model loading error:', error);
    }
  };

  const handleFileSelect = (isDocument, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (isDocument) {
        setDocumentImage(e.target.result);
        console.log('✅ Document image loaded:', file.name);
      } else {
        setCapturedImage(e.target.result);
        console.log('✅ Captured image loaded:', file.name);
      }
      setResults(null); // Clear previous results
    };
    reader.readAsDataURL(file);
  };

  const detectFaces = async (imgElement, canvasElement) => {
    console.log('Detecting faces in image...');
    
    // Try SSD MobileNet first
    let detections = await faceapi
      .detectAllFaces(imgElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`SSD MobileNet detected ${detections.length} faces`);

    // Fallback to TinyFaceDetector
    if (detections.length === 0) {
      console.log('Trying TinyFaceDetector...');
      detections = await faceapi
        .detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      console.log(`TinyFaceDetector detected ${detections.length} faces`);
    }

    // Draw detections on canvas
    if (canvasElement && detections.length > 0) {
      const displaySize = { width: imgElement.width, height: imgElement.height };
      faceapi.matchDimensions(canvasElement, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvasElement.getContext('2d');
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      faceapi.draw.drawDetections(canvasElement, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);
    }

    return detections;
  };

  const runTest = async () => {
    if (!modelsLoaded) {
      alert('Models not loaded yet!');
      return;
    }

    try {
      setStatus({ message: '🔍 Detecting faces...', type: 'loading' });
      setResults(null);

      const img1 = documentImgRef.current;
      const img2 = capturedImgRef.current;
      const canvas1 = documentCanvasRef.current;
      const canvas2 = capturedCanvasRef.current;

      // Detect faces
      setProgress('Detecting faces in document image...');
      const faces1 = await detectFaces(img1, canvas1);
      
      setProgress('Detecting faces in captured image...');
      const faces2 = await detectFaces(img2, canvas2);

      if (faces1.length === 0 || faces2.length === 0) {
        setStatus({ message: '❌ No faces detected in one or both images', type: 'no-match' });
        setResults({
          faces1: faces1.length,
          faces2: faces2.length,
          distance: null,
          confidence: null,
          isMatch: false,
          error: 'No faces detected'
        });
        return;
      }

      // Compare faces
      setProgress('Comparing face descriptors...');
      const descriptor1 = faces1[0].descriptor;
      const descriptor2 = faces2[0].descriptor;
      
      const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
      const threshold = 0.6;
      const isMatch = distance < threshold;
      const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

      console.log('Face Comparison Results:');
      console.log('  Distance:', distance.toFixed(4));
      console.log('  Threshold:', threshold);
      console.log('  Confidence:', Math.round(confidence) + '%');
      console.log('  Match:', isMatch ? 'YES' : 'NO');

      // Display results
      setResults({
        faces1: faces1.length,
        faces2: faces2.length,
        distance: distance.toFixed(4),
        threshold: threshold,
        confidence: Math.round(confidence),
        isMatch: isMatch
      });

      setStatus({
        message: isMatch ? '🎉 Faces MATCH!' : '⚠️ Faces DO NOT match',
        type: isMatch ? 'match' : 'no-match'
      });
      setProgress(`Distance: ${distance.toFixed(4)} | Threshold: ${threshold} | Confidence: ${Math.round(confidence)}%`);

    } catch (error) {
      setStatus({ message: `❌ Error: ${error.message}`, type: 'no-match' });
      console.error('Test error:', error);
    }
  };

  return (
    <div className="face-verification-test">
      <h1>🔍 Face Verification Test</h1>
      
      <div className={`status ${status.type}`}>
        {status.message}
      </div>
      {progress && <div className="progress">{progress}</div>}

      <div className="container">
        <div className="image-box">
          <h3>Document Image</h3>
          <div className="file-input-container">
            <label htmlFor="documentFile">Choose Document Image:</label>
            <input
              type="file"
              id="documentFile"
              accept="image/*"
              onChange={(e) => handleFileSelect(true, e)}
            />
          </div>
          {documentImage && (
            <>
              <img
                ref={documentImgRef}
                src={documentImage}
                alt="Document"
                onLoad={() => {
                  if (documentCanvasRef.current && documentImgRef.current) {
                    documentCanvasRef.current.width = documentImgRef.current.width;
                    documentCanvasRef.current.height = documentImgRef.current.height;
                  }
                }}
              />
              <div className="canvas-container">
                <canvas ref={documentCanvasRef}></canvas>
              </div>
            </>
          )}
        </div>

        <div className="image-box">
          <h3>Captured Image</h3>
          <div className="file-input-container">
            <label htmlFor="capturedFile">Choose Captured Image:</label>
            <input
              type="file"
              id="capturedFile"
              accept="image/*"
              onChange={(e) => handleFileSelect(false, e)}
            />
          </div>
          {capturedImage && (
            <>
              <img
                ref={capturedImgRef}
                src={capturedImage}
                alt="Captured"
                onLoad={() => {
                  if (capturedCanvasRef.current && capturedImgRef.current) {
                    capturedCanvasRef.current.width = capturedImgRef.current.width;
                    capturedCanvasRef.current.height = capturedImgRef.current.height;
                  }
                }}
              />
              <div className="canvas-container">
                <canvas ref={capturedCanvasRef}></canvas>
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="results">
          <h2>📊 Verification Results</h2>
          <div className={`score-circle ${results.isMatch ? 'match' : 'no-match'}`}>
            {results.confidence !== null ? `${results.confidence}%` : 'N/A'}
          </div>
          <div className="result-item">
            <span className="result-label">Faces Detected (Document):</span>
            <span className="result-value">{results.faces1}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Faces Detected (Captured):</span>
            <span className="result-value">{results.faces2}</span>
          </div>
          {results.distance && (
            <>
              <div className="result-item">
                <span className="result-label">Euclidean Distance:</span>
                <span className="result-value">{results.distance}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Match Threshold:</span>
                <span className="result-value">{results.threshold}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Confidence Score:</span>
                <span className="result-value">{results.confidence}%</span>
              </div>
              <div className="result-item">
                <span className="result-label">Match Result:</span>
                <span className="result-value">
                  {results.isMatch ? '✅ MATCH' : '❌ NO MATCH'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={runTest}
        disabled={!testReady}
        className="test-button"
      >
        Run Test
      </button>
    </div>
  );
};

export default FaceVerificationTest;
