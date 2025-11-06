"""
Face Detection and Matching Service
Detects faces in documents and performs face matching verification
"""

from deepface import DeepFace
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image


class FaceDetectionService:
    """Service for face detection and matching"""

    def __init__(self):
        """Initialize face detection service"""
        # DeepFace models are loaded on demand.
        # We can preload a model here if we want to.
        # For example, to preload the default VGG-Face model:
        DeepFace.build_model('VGG-Face')
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


# Singleton instance
_face_service = None

def get_face_service() -> FaceDetectionService:
    """Get or create FaceDetectionService instance"""
    global _face_service
    if _face_service is None:
        _face_service = FaceDetectionService()
    return _face_service
