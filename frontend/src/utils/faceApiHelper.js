/**
 * Face API Helper
 * Uses face-api.js for face detection, recognition, and comparison
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models (call once on app startup)
 */
export const loadFaceApiModels = async () => {
  if (modelsLoaded) return true;

  try {
    const MODEL_URL = '/models';
    console.log('Loading face-api.js models from:', MODEL_URL);
    
    // Load models with timeout
    const loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ]);

    // Add 10 second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Model loading timeout')), 10000)
    );

    await Promise.race([loadPromise, timeoutPromise]);

    modelsLoaded = true;
    console.log('✅ Face API models loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
    console.warn('Face verification will not be available');
    return false;
  }
};

/**
 * Detect faces in an image
 * @param {HTMLImageElement|HTMLCanvasElement|string} input - Image element or data URL
 * @returns {Promise<Array>} Array of detected faces with descriptors
 */
export const detectFaces = async (input) => {
  try {
    if (!modelsLoaded) {
      await loadFaceApiModels();
    }

    // Convert data URL to image element if needed
    const img = typeof input === 'string' ? await loadImage(input) : input;

    console.log('Detecting faces with SSD MobileNet (more accurate)...');
    
    // Try with SSD MobileNet first (more accurate)
    let detections = await faceapi
      .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`SSD MobileNet detected ${detections.length} faces`);

    // If no faces found, try with TinyFaceDetector (faster, lower quality)
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

/**
 * Compare two faces and return similarity score
 * @param {string|HTMLImageElement} image1 - First image (selfie)
 * @param {string|HTMLImageElement} image2 - Second image (ID document)
 * @returns {Promise<Object>} Comparison result with match status and score
 */
export const compareFaces = async (image1, image2) => {
  try {
    if (!modelsLoaded) {
      console.log('Models not loaded, attempting to load...');
      const loaded = await loadFaceApiModels();
      if (!loaded) {
        return {
          match: false,
          error: 'Face API models not loaded. Please refresh the page.',
          confidence: 0
        };
      }
    }

    console.log('Detecting faces in both images...');
    
    // Detect faces in both images
    const [faces1, faces2] = await Promise.all([
      detectFaces(image1),
      detectFaces(image2)
    ]);

    console.log(`Faces detected - Selfie: ${faces1.length}, Document: ${faces2.length}`);

    if (faces1.length === 0) {
      console.error('❌ No face detected in selfie. Tips: Ensure good lighting, face is fully visible, and looking at camera.');
      return {
        match: false,
        error: 'No face detected in selfie. Please ensure good lighting and face is clearly visible.',
        confidence: 0,
        facesDetected: {
          selfie: 0,
          document: faces2.length
        }
      };
    }

    if (faces2.length === 0) {
      console.error('❌ No face detected in ID document. Tips: Ensure the photo on the ID is clear and visible.');
      return {
        match: false,
        error: 'No face detected in ID document. Please ensure the photo on document is clear and visible.',
        confidence: 0,
        facesDetected: {
          selfie: faces1.length,
          document: 0
        }
      };
    }

    console.log('✅ Faces detected in both images, comparing...');

    console.log('✅ Faces detected in both images, comparing...');

    // Get the first face from each image
    const descriptor1 = faces1[0].descriptor;
    const descriptor2 = faces2[0].descriptor;

    // Calculate Euclidean distance between face descriptors
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);

    // Convert distance to similarity score (0-100%)
    // Distance < 0.6 is typically a match
    const threshold = 0.6;
    const isMatch = distance < threshold;
    const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

    console.log(`📊 Face Comparison Results:`);
    console.log(`   Distance: ${distance.toFixed(3)}`);
    console.log(`   Threshold: ${threshold}`);
    console.log(`   Confidence: ${Math.round(confidence)}%`);
    console.log(`   Match: ${isMatch ? '✅ YES' : '❌ NO'}`);

    return {
      match: isMatch,
      confidence: Math.round(confidence),
      distance: distance,
      threshold: threshold,
      facesDetected: {
        selfie: faces1.length,
        document: faces2.length
      }
    };
  } catch (error) {
    console.error('Face comparison error:', error);
    return {
      match: false,
      error: error.message || 'Face comparison failed',
      confidence: 0
    };
  }
};

/**
 * Extract face from ID document with face detection
 * @param {string|File} imageInput - Image file or data URL
 * @returns {Promise<string|null>} Base64 data URL of cropped face
 */
export const extractFaceFromDocument = async (imageInput) => {
  try {
    if (!modelsLoaded) {
      await loadFaceApiModels();
    }

    // Load image
    const img = typeof imageInput === 'string' 
      ? await loadImage(imageInput)
      : await loadImageFromFile(imageInput);

    // Detect face with larger detector for better accuracy
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks();

    if (!detection) {
      console.log('No face detected in document');
      return null;
    }

    // Get face bounding box with some padding
    const { x, y, width, height } = detection.detection.box;
    const padding = 0.3; // 30% padding
    const paddedBox = {
      x: Math.max(0, x - width * padding / 2),
      y: Math.max(0, y - height * padding / 2),
      width: width * (1 + padding),
      height: height * (1 + padding)
    };

    // Crop face from image
    const canvas = document.createElement('canvas');
    canvas.width = paddedBox.width;
    canvas.height = paddedBox.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      img,
      paddedBox.x, paddedBox.y, paddedBox.width, paddedBox.height,
      0, 0, paddedBox.width, paddedBox.height
    );

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('Face extraction error:', error);
    return null;
  }
};

/**
 * Helper: Load image from data URL
 */
const loadImage = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

/**
 * Helper: Load image from File object
 */
const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = () => modelsLoaded;

/**
 * Get face detection info from image
 * @param {string|File} imageInput - Image to analyze
 * @returns {Promise<Object>} Face detection results
 */
export const getFaceInfo = async (imageInput) => {
  try {
    const faces = await detectFaces(imageInput);
    
    return {
      facesDetected: faces.length,
      faces: faces.map((face, index) => ({
        id: index,
        box: face.detection.box,
        confidence: face.detection.score,
        landmarks: face.landmarks.positions.length
      }))
    };
  } catch (error) {
    console.error('Face info error:', error);
    return {
      facesDetected: 0,
      faces: [],
      error: error.message
    };
  }
};
