"""
PaddleOCR Service
Fallback OCR service using PaddleOCR for robust text extraction
"""

from paddleocr import PaddleOCR
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from PIL import Image


class PaddleOCRService:
    """Service for OCR using PaddleOCR"""

    def __init__(self, use_angle_cls=True, lang='en'):
        """
        Initialize PaddleOCR service

        Args:
            use_angle_cls: Whether to use angle classification
            lang: Language for OCR ('en' for English, 'hi' for Hindi)
        """
        self.ocr = PaddleOCR(
            use_angle_cls=use_angle_cls,
            lang=lang,
            use_gpu=False,  # Set to True if GPU is available
            show_log=False
        )

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for better OCR results

        Args:
            image_path: Path to the image file

        Returns:
            Preprocessed image as numpy array
        """
        # Read image
        image = cv2.imread(image_path)

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)

        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )

        # Deskew if needed
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle

            if abs(angle) > 0.5:  # Only rotate if angle is significant
                (h, w) = thresh.shape
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                thresh = cv2.warpAffine(
                    thresh, M, (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE
                )

        return thresh

    def extract_text(self, image_path: str, preprocess: bool = True) -> Dict[str, Any]:
        """
        Extract text from image using PaddleOCR

        Args:
            image_path: Path to the image file
            preprocess: Whether to preprocess the image

        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            if preprocess:
                # Preprocess and save temporarily
                processed_img = self.preprocess_image(image_path)
                temp_path = image_path.replace('.', '_processed.')
                cv2.imwrite(temp_path, processed_img)
                result = self.ocr.ocr(temp_path, cls=True)
            else:
                result = self.ocr.ocr(image_path, cls=True)

            if not result or not result[0]:
                return {
                    'success': False,
                    'error': 'No text detected',
                    'raw_text': '',
                    'method': 'paddleocr'
                }

            # Extract text and confidence scores
            texts = []
            confidences = []
            bounding_boxes = []

            for line in result[0]:
                bbox, (text, confidence) = line
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
                'method': 'paddleocr'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_text': '',
                'method': 'paddleocr'
            }

    def extract_with_layout(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text with layout information

        Args:
            image_path: Path to the image file

        Returns:
            Dictionary containing text organized by layout
        """
        try:
            result = self.ocr.ocr(image_path, cls=True)

            if not result or not result[0]:
                return {
                    'success': False,
                    'error': 'No text detected',
                    'method': 'paddleocr'
                }

            # Organize text by vertical position (top to bottom)
            lines_with_pos = []
            for line in result[0]:
                bbox, (text, confidence) = line
                # Use top-left y coordinate for sorting
                y_pos = bbox[0][1]
                lines_with_pos.append((y_pos, text, confidence, bbox))

            # Sort by y position
            lines_with_pos.sort(key=lambda x: x[0])

            # Group lines that are close together (same row)
            grouped_lines = []
            current_group = []
            prev_y = -1
            y_threshold = 20  # pixels

            for y_pos, text, conf, bbox in lines_with_pos:
                if prev_y == -1 or abs(y_pos - prev_y) < y_threshold:
                    current_group.append(text)
                else:
                    if current_group:
                        grouped_lines.append(' '.join(current_group))
                    current_group = [text]
                prev_y = y_pos

            if current_group:
                grouped_lines.append(' '.join(current_group))

            return {
                'success': True,
                'grouped_lines': grouped_lines,
                'raw_text': '\n'.join(grouped_lines),
                'method': 'paddleocr'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'method': 'paddleocr'
            }


# Singleton instance
_paddle_service = None

def get_paddle_service() -> PaddleOCRService:
    """Get or create PaddleOCRService instance"""
    global _paddle_service
    if _paddle_service is None:
        _paddle_service = PaddleOCRService()
    return _paddle_service
