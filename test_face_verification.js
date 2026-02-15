/**
 * Face Verification Test Script
 * Tests face-api.js face matching on images in Test folder
 */

const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Patch nodejs environment for face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, 'frontend', 'public', 'models');
const TEST_FOLDER = path.join(__dirname, 'Test');

async function loadModels() {
  console.log('Loading face-api.js models...');
  console.log('Model path:', MODEL_PATH);
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
    faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH),
  ]);
  
  console.log('✅ Models loaded successfully!\n');
}

async function loadImage(imagePath) {
  const img = await canvas.loadImage(imagePath);
  return img;
}

async function detectFaces(img, imageName) {
  console.log(`\n🔍 Detecting faces in "${imageName}"...`);
  
  // Try SSD MobileNet first
  let detections = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  console.log(`   SSD MobileNet: ${detections.length} faces detected`);

  // Fallback to TinyFaceDetector if no faces found
  if (detections.length === 0) {
    console.log('   Trying TinyFaceDetector...');
    detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    console.log(`   TinyFaceDetector: ${detections.length} faces detected`);
  }

  if (detections.length > 0) {
    const box = detections[0].detection.box;
    console.log(`   ✅ Face found at (${Math.round(box.x)}, ${Math.round(box.y)}) - ${Math.round(box.width)}x${Math.round(box.height)}px`);
  } else {
    console.log('   ❌ No faces detected');
  }

  return detections;
}

async function compareFaces(img1Path, img2Path) {
  console.log('\n' + '='.repeat(70));
  console.log('FACE VERIFICATION TEST');
  console.log('='.repeat(70));
  
  const img1Name = path.basename(img1Path);
  const img2Name = path.basename(img2Path);
  
  console.log(`\nImage 1: ${img1Name}`);
  console.log(`Image 2: ${img2Name}`);

  // Load images
  const img1 = await loadImage(img1Path);
  const img2 = await loadImage(img2Path);

  console.log(`\nImage 1 dimensions: ${img1.width}x${img1.height}`);
  console.log(`Image 2 dimensions: ${img2.width}x${img2.height}`);

  // Detect faces
  const faces1 = await detectFaces(img1, img1Name);
  const faces2 = await detectFaces(img2, img2Name);

  // Check if faces found in both
  if (faces1.length === 0) {
    console.log(`\n❌ FAILED: No face detected in ${img1Name}`);
    return;
  }

  if (faces2.length === 0) {
    console.log(`\n❌ FAILED: No face detected in ${img2Name}`);
    return;
  }

  // Compare faces
  console.log('\n' + '─'.repeat(70));
  console.log('📊 COMPARISON RESULTS');
  console.log('─'.repeat(70));

  const descriptor1 = faces1[0].descriptor;
  const descriptor2 = faces2[0].descriptor;
  
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  const threshold = 0.6;
  const isMatch = distance < threshold;
  const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

  console.log(`\n   Euclidean Distance: ${distance.toFixed(4)}`);
  console.log(`   Match Threshold:    ${threshold}`);
  console.log(`   Confidence Score:   ${Math.round(confidence)}%`);
  console.log(`   \n   Match Result:       ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
  
  if (isMatch) {
    console.log(`\n   🎉 The faces in the two images match!`);
  } else {
    console.log(`\n   ⚠️  The faces in the two images do NOT match.`);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  
  return {
    match: isMatch,
    confidence: Math.round(confidence),
    distance: distance,
    facesDetected: {
      image1: faces1.length,
      image2: faces2.length
    }
  };
}

async function main() {
  try {
    // Load models
    await loadModels();

    // Get test images
    const image1Path = path.join(TEST_FOLDER, 'testDocVerify.jpeg');
    const image2Path = path.join(TEST_FOLDER, 'testDocVerify1.jpeg');

    // Check if files exist
    if (!fs.existsSync(image1Path)) {
      console.error(`❌ File not found: ${image1Path}`);
      return;
    }
    if (!fs.existsSync(image2Path)) {
      console.error(`❌ File not found: ${image2Path}`);
      return;
    }

    // Compare faces
    const result = await compareFaces(image1Path, image2Path);
    
    // Exit with appropriate code
    process.exit(result && result.match ? 0 : 1);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
main();
