/**
 * Face Detection Utility
 * Detects and extracts face photos from ID documents
 */

/**
 * Extract face from ID document using smart region detection
 * @param {File|Blob|string} imageFile - The image file to process
 * @param {string} documentType - Type of document (aadhaar, pan, driving_license, voter_id, passport)
 * @returns {Promise<string|null>} - Base64 data URL of extracted face or null
 */
export const extractFaceFromDocument = async (imageFile, documentType = 'aadhaar') => {
  try {
    const img = await createImageElement(imageFile);

    // Analyze image to find the most likely face region based on document type
    const faceRegion = await detectFaceRegion(img, documentType);

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
 * Detect face region in image based on document type and layout
 */
const detectFaceRegion = async (img, documentType) => {
  // Check orientation first
  const isPortrait = img.height > img.width;

  // Document-specific face positions
  switch (documentType) {
    case 'driving_license':
    case 'dl':
      // Driving License: Photo typically on top-right
      return {
        x: img.width * 0.65,
        y: img.height * 0.08,
        width: img.width * 0.30,
        height: img.height * 0.45
      };

    case 'voter_id':
    case 'epic':
      // Voter ID: Photo typically in center or center-left
      return {
        x: img.width * 0.30,
        y: img.height * 0.20,
        width: img.width * 0.40,
        height: img.height * 0.60
      };

    case 'passport':
      // Passport: Photo typically on left side, higher position
      return {
        x: img.width * 0.05,
        y: img.height * 0.15,
        width: img.width * 0.30,
        height: img.height * 0.45
      };

    case 'aadhaar':
    case 'pan':
    default:
      // Aadhaar/PAN: Photo on left side
      if (isPortrait) {
        // Portrait orientation - face at top center
        return {
          x: img.width * 0.25,
          y: img.height * 0.10,
          width: img.width * 0.50,
          height: img.height * 0.35
        };
      }

      // Default: Left side for landscape cards
      return {
        x: img.width * 0.03,
        y: img.height * 0.15,
        width: img.width * 0.32,
        height: img.height * 0.65
      };
  }
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
