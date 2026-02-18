"""
Face Detection and Matching Service
Detects faces in documents and performs face matching verification (using OpenCV)
"""

# from deepface import DeepFace  # Commenting out to avoid heavy TensorFlow dependency
import cv2
import numpy as np
import base64
from io import BytesIO
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image


class FaceDetectionService:
    """Service for face detection and matching (using OpenCV)"""

    def __init__(self):
        """Initialize face detection service"""
        # Initialize OpenCV's Haar Cascade face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    def detect_faces(self, image_path: str) -> Dict[str, Any]:
        """
        Detect faces in an image and get embeddings.

        Args:
            image_path: Path to the image file

        Returns:
            Dictionary containing face detection results
        """
        try:
            # The represent function returns a list of dictionaries, one for each detected face.
            # Each dictionary contains the embedding and the facial area.
            embedding_objs = DeepFace.represent(img_path=image_path, enforce_detection=True)

            if not embedding_objs:
                return {
                    'success': False,
                    'error': 'No face detected in image',
                    'face_count': 0
                }

            # Extracting information from the first detected face
            first_face = embedding_objs[0]
            face_encoding = first_face['embedding']
            face_location = first_face['facial_area']
            # DeepFace location format is {'x': int, 'y': int, 'w': int, 'h': int}
            # Convert to face_recognition format (top, right, bottom, left)
            x, y, w, h = face_location['x'], face_location['y'], face_location['w'], face_location['h']
            face_location_converted = (y, x + w, y + h, x)


            return {
                'success': True,
                'face_count': len(embedding_objs),
                'face_locations': [face_location_converted], # Returning only the first face location for compatibility
                'face_encodings': [e['embedding'] for e in embedding_objs],
                'primary_face_encoding': face_encoding
            }

        except Exception as e:
            # DeepFace raises an exception if no face is detected
            return {
                'success': False,
                'error': str(e),
                'face_count': 0
            }

    def analyze_face_quality(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze face quality in image

        Args:
            image_path: Path to the image file

        Returns:
            Dictionary containing quality analysis
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                return {
                    'success': False,
                    'error': 'No face detected',
                    'is_good_quality': False
                }

            # Analyze first face
            x, y, w, h = faces[0]
            face_region = gray[y:y+h, x:x+w]

            # Check blur (using Laplacian variance)
            blur_score = cv2.Laplacian(face_region, cv2.CV_64F).var()

            # Check brightness
            brightness = np.mean(face_region)

            # Check if face is too small
            min_face_size = 80
            face_size_ok = w >= min_face_size and h >= min_face_size

            # Determine if quality is good
            is_good_quality = (
                blur_score > 100 and  # Not too blurry
                40 < brightness < 220 and  # Good brightness
                face_size_ok  # Large enough
            )

            return {
                'success': True,
                'is_good_quality': is_good_quality,
                'quality_metrics': {
                    'blur_score': float(blur_score),
                    'brightness': float(brightness),
                    'face_width': int(w),
                    'face_height': int(h),
                    'blur_acceptable': blur_score > 100,
                    'brightness_acceptable': 40 < brightness < 220,
                    'size_acceptable': face_size_ok
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'is_good_quality': False
            }

    def compare_faces(
        self,
        image1_path: str,
        image2_path: str,
        tolerance: float = 0.4 # Default tolerance for VGG-Face model with cosine similarity
    ) -> Dict[str, Any]:
        """
        Compare two faces and determine if they match

        Args:
            image1_path: Path to first image
            image2_path: Path to second image
            tolerance: Matching threshold. DeepFace's VGG-Face model uses a default of 0.4 for cosine distance.

        Returns:
            Dictionary containing comparison results
        """
        try:
            # The verify function returns a dictionary with comparison results
            result = DeepFace.verify(
                img1_path=image1_path,
                img2_path=image2_path,
                enforce_detection=True
            )

            face_distance = result.get('distance', 1.0)
            is_match = result.get('verified', False)

            # Calculate similarity percentage (inverse of cosine distance)
            similarity_percentage = (1 - face_distance) * 100

            return {
                'success': True,
                'is_match': bool(is_match),
                'face_distance': float(face_distance),
                'similarity_percentage': float(similarity_percentage),
                'confidence': 'high' if face_distance < 0.2 else 'medium' if face_distance < 0.4 else 'low'
            }

        except Exception as e:
            # This can happen if a face is not found in one of the images
            return {
                'success': False,
                'error': str(e)
            }

    def detect_liveness(self, image_path: str) -> Dict[str, Any]:
        """
        Basic liveness detection using texture analysis

        Args:
            image_path: Path to the image file

        Returns:
            Dictionary containing liveness detection results
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5
            )

            if len(faces) == 0:
                return {
                    'success': False,
                    'error': 'No face detected',
                    'is_live': False
                }

            # Get first face region
            x, y, w, h = faces[0]
            face_region = gray[y:y+h, x:x+w]

            # Calculate texture variance using LBP-like approach
            # Real faces have more texture variation than printed photos
            texture_variance = np.var(face_region)

            # Calculate edge density
            edges = cv2.Canny(face_region, 50, 150)
            edge_density = np.sum(edges) / (w * h * 255)

            # Heuristics for liveness (these are basic checks)
            # A real implementation would use deep learning models
            is_live = (
                texture_variance > 500 and  # Sufficient texture variation
                edge_density > 0.02  # Sufficient edge information
            )

            return {
                'success': True,
                'is_live': is_live,
                'confidence': 'medium',  # Basic detection has medium confidence
                'metrics': {
                    'texture_variance': float(texture_variance),
                    'edge_density': float(edge_density)
                },
                'note': 'Basic liveness detection - for production use advanced ML models'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'is_live': False
            }

    def extract_face_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
        """
        Extract and save face region from image

        Args:
            image_path: Path to input image
            output_path: Path to save extracted face

        Returns:
            Dictionary containing extraction results
        """
        try:
            # extract_faces returns a list of dictionaries with face, facial_area, and confidence
            extracted_faces = DeepFace.extract_faces(img_path=image_path, enforce_detection=True)

            if not extracted_faces:
                return {
                    'success': False,
                    'error': 'No face detected'
                }
            
            # Get the first face, which is a numpy array (face image)
            # The face is already a numpy array in BGR format if detector_backend is 'opencv'
            face_image = extracted_faces[0]['face']
            
            # DeepFace returns face as float, convert to uint8 for saving
            face_image_uint8 = (face_image * 255).astype(np.uint8)

            # Save face
            cv2.imwrite(output_path, face_image_uint8)
            
            face_location = extracted_faces[0]['facial_area']
            x, y, w, h = face_location['x'], face_location['y'], face_location['w'], face_location['h']

            return {
                'success': True,
                'face_path': output_path,
                'face_location': {
                    'top': y,
                    'right': x + w,
                    'bottom': y + h,
                    'left': x
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_face_as_base64(self, image_path: str) -> Dict[str, Any]:
        """
        Extract face from image and return as base64 string (using OpenCV)

        Args:
            image_path: Path to input image

        Returns:
            Dictionary containing extraction results with base64 encoded face
        """
        import base64
        from io import BytesIO
        
        try:
            # Read image using OpenCV
            image = cv2.imread(image_path)
            if image is None:
                print(f"[Face] Could not load image: {image_path}")
                return {
                    'success': False,
                    'error': 'Could not load image'
                }
            
            print(f"[Face] Image loaded: {image.shape}")
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Try multiple detection strategies for better results on ID cards
            faces = None
            
            # Strategy 1: Standard detection
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.05,  # More sensitive
                minNeighbors=3,     # Lower threshold
                minSize=(20, 20)    # Smaller minimum size
            )
            print(f"[Face] Strategy 1 found {len(faces)} faces")
            
            # Strategy 2: If no faces, try with even more relaxed parameters
            if len(faces) == 0:
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.03,
                    minNeighbors=2,
                    minSize=(15, 15)
                )
                print(f"[Face] Strategy 2 found {len(faces)} faces")

            if len(faces) == 0:
                print(f"[Face] No face detected after all strategies")
                return {
                    'success': False,
                    'error': 'No face detected in document'
                }
            
            print(f"[Face] Found {len(faces)} faces, using first one")
            
            # Get the first (or largest) face
            if len(faces) > 1:
                # Sort by area (w*h) and get the largest
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            
            (x, y, w, h) = faces[0]
            print(f"[Face] Face location: x={x}, y={y}, w={w}, h={h}")
            
            # Add very generous padding (150%) to show full document context including text/borders
            # This shows more like a passport photo section with surrounding context
            padding_horizontal = int(w * 1.5)
            padding_vertical = int(h * 1.5)
            
            x_start = max(0, x - padding_horizontal)
            y_start = max(0, y - padding_vertical)
            x_end = min(image.shape[1], x + w + padding_horizontal)
            y_end = min(image.shape[0], y + h + padding_vertical)
            
            # Extract face region
            face_image = image[y_start:y_end, x_start:x_end]
            print(f"[Face] Extracted face size (before resize): {face_image.shape}")
            
            # Resize to at least 224x224 for better face-api.js detection
            target_size = 224
            if face_image.shape[0] < target_size or face_image.shape[1] < target_size:
                # Calculate scale to make the smaller dimension = target_size
                scale = target_size / min(face_image.shape[0], face_image.shape[1])
                new_width = int(face_image.shape[1] * scale)
                new_height = int(face_image.shape[0] * scale)
                face_image = cv2.resize(face_image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                print(f"[Face] Resized face to: {face_image.shape}")
            
            # Convert BGR to RGB
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image
            face_pil = Image.fromarray(face_rgb)
            
            # Convert to base64 with high quality
            buffered = BytesIO()
            face_pil.save(buffered, format="JPEG", quality=95)
            face_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            print(f"[Face] Successfully converted to base64")

            return {
                'success': True,
                'face_image_base64': face_base64,
                'face_location': {
                    'top': y,
                    'right': x + w,
                    'bottom': y + h,
                    'left': x
                },
                'confidence': 0.85  # Approximate confidence for Haar Cascade
            }

        except Exception as e:
            print(f"[Face] Exception during extraction: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }

    def detect_document_boundary(self, image_path: str) -> Dict[str, Any]:
        """
        Detect the boundary of the ID card/document in the image and crop it.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing cropped document image in base64 format
        """
        try:
            import base64
            from io import BytesIO
            
            print(f"[Document Crop] Processing image: {image_path}")
            
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'success': False,
                    'error': f'Failed to read image: {image_path}'
                }
            
            original_height, original_width = image.shape[:2]
            print(f"[Document Crop] Original size: {original_width}x{original_height}")
            
            # Create a copy for processing
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Dilate edges to close gaps
            kernel = np.ones((5, 5), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=2)
            
            # Find contours
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                print("[Document Crop] No contours found, using full image")
                return self._encode_image_to_base64(image)
            
            # Find the largest contour
            largest_contour = max(contours, key=cv2.contourArea)
            contour_area = cv2.contourArea(largest_contour)
            image_area = original_width * original_height
            
            # Check if the contour is significant (at least 30% of image)
            if contour_area < image_area * 0.3:
                print(f"[Document Crop] Largest contour too small ({contour_area/image_area*100:.1f}%), using full image")
                return self._encode_image_to_base64(image)
            
            # Approximate contour to polygon
            peri = cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, 0.02 * peri, True)
            
            # If we have a quadrilateral, do perspective transform
            if len(approx) == 4:
                print("[Document Crop] Found quadrilateral, applying perspective transform")
                cropped = self._four_point_transform(image, approx.reshape(4, 2))
            else:
                # Otherwise, use bounding rectangle
                print(f"[Document Crop] Using bounding rectangle (contour points: {len(approx)})")
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # Add small margin (2%)
                margin_x = int(w * 0.02)
                margin_y = int(h * 0.02)
                
                x = max(0, x - margin_x)
                y = max(0, y - margin_y)
                w = min(original_width - x, w + 2 * margin_x)
                h = min(original_height - y, h + 2 * margin_y)
                
                cropped = image[y:y+h, x:x+w]
            
            if cropped is None or cropped.size == 0:
                print("[Document Crop] Crop failed, using full image")
                return self._encode_image_to_base64(image)
            
            print(f"[Document Crop] Cropped size: {cropped.shape[1]}x{cropped.shape[0]}")
            return self._encode_image_to_base64(cropped)
            
        except Exception as e:
            print(f"[Document Crop] Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _four_point_transform(self, image: np.ndarray, pts: np.ndarray) -> np.ndarray:
        """
        Apply perspective transform to get top-down view of document.
        
        Args:
            image: Input image
            pts: Four corner points of the document
            
        Returns:
            Warped image
        """
        # Order points: top-left, top-right, bottom-right, bottom-left
        rect = self._order_points(pts)
        (tl, tr, br, bl) = rect
        
        # Compute width of new image
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        
        # Compute height of new image
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
        # Construct destination points
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype="float32")
        
        # Compute perspective transform matrix and apply it
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        
        return warped
    
    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """
        Order points in clockwise order: top-left, top-right, bottom-right, bottom-left.
        
        Args:
            pts: Array of 4 points
            
        Returns:
            Ordered points array
        """
        rect = np.zeros((4, 2), dtype="float32")
        
        # Sum: top-left will have smallest sum, bottom-right will have largest sum
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
        # Diff: top-right will have smallest diff, bottom-left will have largest diff
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect
    
    def _encode_image_to_base64(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Encode OpenCV image to base64 string.
        
        Args:
            image: OpenCV image (numpy array)
            
        Returns:
            Dictionary with success status and base64 encoded image
        """
        try:
            import base64
            
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(image_rgb)
            
            # Convert to base64
            buffered = BytesIO()
            pil_image.save(buffered, format="JPEG", quality=95)
            image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            return {
                'success': True,
                'image_base64': f'data:image/jpeg;base64,{image_base64}',
                'width': image.shape[1],
                'height': image.shape[0]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
_face_service = None

def get_face_service() -> FaceDetectionService:
    """Get or create FaceDetectionService instance"""
    global _face_service
    if _face_service is None:
        _face_service = FaceDetectionService()
    return _face_service
