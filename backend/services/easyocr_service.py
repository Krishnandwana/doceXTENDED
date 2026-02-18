"""
EasyOCR Service
Reliable OCR service using EasyOCR for text extraction
"""

import easyocr
import numpy as np
from typing import Dict, Any, List
from PIL import Image
import cv2


class EasyOCRService:
    """Service for OCR using EasyOCR"""

    def __init__(self, languages=['en']):
        """
        Initialize EasyOCR service

        Args:
            languages: List of languages for OCR (default: ['en'])
        """
        print("Initializing EasyOCR...")
        self.reader = easyocr.Reader(languages, gpu=False)
        print("EasyOCR initialized successfully")

    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text from image using EasyOCR

        Args:
            image_path: Path to the image file

        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            # Read image using OpenCV to avoid PIL compatibility issues
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'success': False,
                    'error': f'Could not read image from {image_path}',
                    'raw_text': '',
                    'method': 'easyocr'
                }
            
            # Convert BGR to RGB (OpenCV uses BGR, EasyOCR expects RGB)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Extract text using EasyOCR
            result = self.reader.readtext(image)

            if not result:
                return {
                    'success': False,
                    'error': 'No text detected',
                    'raw_text': '',
                    'method': 'easyocr'
                }

            # Extract text and confidence scores
            texts = []
            confidences = []
            bounding_boxes = []

            for (bbox, text, confidence) in result:
                texts.append(text)
                confidences.append(confidence)
                bounding_boxes.append(bbox)

            # Combine all text
            raw_text = ' '.join(texts)

            return {
                'success': True,
                'raw_text': raw_text,
                'structured_text': texts,
                'confidence_scores': confidences,
                'bounding_boxes': bounding_boxes,
                'average_confidence': np.mean(confidences) if confidences else 0,
                'method': 'easyocr'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_text': '',
                'method': 'easyocr'
            }


# Singleton instance
_easyocr_service = None

def get_easyocr_service() -> EasyOCRService:
    """Get or create EasyOCRService instance"""
    global _easyocr_service
    if _easyocr_service is None:
        _easyocr_service = EasyOCRService()
    return _easyocr_service
