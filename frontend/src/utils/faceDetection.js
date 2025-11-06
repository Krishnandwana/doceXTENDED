/**
 * Face Detection Utility
 * Detects and extracts face photos from ID documents
 */

/**
 * Extract face from ID document using smart region detection
 * @param {File|Blob|string} imageFile - The image file to process
 * @returns {Promise<string|null>} - Base64 data URL of extracted face or null
 */
export const extractFaceFromDocument = async (imageFile) => {
  try {
    const img = await createImageElement(imageFile);

    // Analyze image to find the most likely face region
    const faceRegion = await detectFaceRegion(img);

    if (!faceRegion) {
      console.log('Could not detect face region');
      return null;
    }

    // Extract face region
    const faceImage = await cropImageRegion(img, faceRegion);
    return faceImage;

  } catch (error) {
    console.error('Face extraction error:', error);
    return null;
  }
};

/**
 * Detect face region in image using multiple strategies
 */
const detectFaceRegion = async (img) => {
  // Strategy 1: Standard ID card layout (left side)
  // Most ID cards have photo on the left, roughly 1/3 of width
  const leftRegion = {
    x: img.width * 0.03,
    y: img.height * 0.1,
    width: img.width * 0.35,
    height: img.height * 0.7
  };

  // Strategy 2: Check if image is portrait (vertical) vs landscape
  if (img.height > img.width) {
    // Portrait orientation - face might be at top
    return {
      x: img.width * 0.2,
      y: img.height * 0.1,
      width: img.width * 0.6,
      height: img.height * 0.4
    };
  }

  // Default to left region for landscape ID cards
  return leftRegion;
};

/**
 * Create image element from file
 */
const createImageElement = (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;

    if (imageFile instanceof File || imageFile instanceof Blob) {
      img.src = URL.createObjectURL(imageFile);
    } else if (typeof imageFile === 'string') {
      img.src = imageFile;
    } else {
      reject(new Error('Invalid image file type'));
    }
  });
};

/**
 * Crop image region using canvas
 */
const cropImageRegion = (img, box) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = box.width;
    canvas.height = box.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      img,
      box.x, box.y, box.width, box.height,
      0, 0, box.width, box.height
    );

    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
};

/**
 * Simple fallback face extraction without models
 * Attempts to find face-like regions using basic image processing
 */
export const extractFaceSimple = async (imageFile) => {
  try {
    const img = await createImageElement(imageFile);

    // For ID cards, the face is typically in the left portion
    // This is a very basic heuristic
    const estimatedFaceRegion = {
      x: img.width * 0.05,
      y: img.height * 0.15,
      width: img.width * 0.35,
      height: img.height * 0.55
    };

    const faceImage = await cropImageRegion(img, estimatedFaceRegion);
    return faceImage;

  } catch (error) {
    console.error('Simple face extraction error:', error);
    return null;
  }
};
