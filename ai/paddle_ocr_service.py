"""
PaddleOCR Service
Primary OCR service using PaddleOCR for text extraction.
"""

import os
from typing import Dict, Any
import tempfile

import cv2
import numpy as np


class PaddleOCRService:
    """Service for OCR using PaddleOCR."""

    def __init__(self, use_angle_cls: bool = True, lang: str = "en"):
        # Keep Paddle cache/model files inside project workspace to avoid
        # permission issues with user profile cache directories.
        paddle_home = os.path.abspath(os.getenv("PADDLE_HOME", "data/paddle_home"))
        os.makedirs(paddle_home, exist_ok=True)
        os.makedirs(os.path.join(paddle_home, ".cache"), exist_ok=True)
        os.environ["PADDLE_HOME"] = paddle_home
        os.environ.setdefault("XDG_CACHE_HOME", os.path.join(paddle_home, ".cache"))

        self.ocr = None
        self.rapid_ocr = None
        self.engine = "unavailable"

        try:
            from paddleocr import PaddleOCR
            try:
                self.ocr = PaddleOCR(
                    use_angle_cls=use_angle_cls,
                    lang=lang,
                )
            except TypeError:
                # Fallback for PaddleOCR API variations across major versions.
                self.ocr = PaddleOCR(lang=lang)
            self.engine = "paddleocr"
        except Exception:
            # Network-restricted fallback: RapidOCR ONNX engine.
            try:
                from rapidocr_onnxruntime import RapidOCR
                self.rapid_ocr = RapidOCR()
                self.engine = "rapidocr"
            except Exception:
                self.engine = "unavailable"

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR results."""
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray)
        thresh = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2,
        )

        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            angle = -(90 + angle) if angle < -45 else -angle

            if abs(angle) > 0.5:
                h, w = thresh.shape
                center = (w // 2, h // 2)
                matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                thresh = cv2.warpAffine(
                    thresh,
                    matrix,
                    (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE,
                )

        return thresh

    def extract_text(self, image_path: str, preprocess: bool = True) -> Dict[str, Any]:
        """Extract text from image using PaddleOCR."""
        try:
            if self.engine == "unavailable":
                return {
                    "success": False,
                    "error": "No OCR engine available (PaddleOCR and RapidOCR unavailable)",
                    "raw_text": "",
                    "method": "none",
                }

            input_path = image_path
            temp_file_path = None

            if preprocess:
                processed = self.preprocess_image(image_path)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                    temp_file_path = tmp.name
                cv2.imwrite(temp_file_path, processed)
                input_path = temp_file_path

            if self.engine == "paddleocr":
                result = self.ocr.ocr(input_path, cls=True)
                if temp_file_path:
                    try:
                        os.remove(temp_file_path)
                    except Exception:
                        pass

                if not result or not result[0]:
                    return {
                        "success": False,
                        "error": "No text detected",
                        "raw_text": "",
                        "method": "paddleocr",
                    }

                texts = []
                confidences = []
                bounding_boxes = []

                for line in result[0]:
                    bbox, (text, confidence) = line
                    texts.append(text)
                    confidences.append(float(confidence))
                    bounding_boxes.append(bbox)

                return {
                    "success": True,
                    "raw_text": " ".join(texts),
                    "structured_text": texts,
                    "confidence_scores": confidences,
                    "bounding_boxes": bounding_boxes,
                    "average_confidence": float(np.mean(confidences)) if confidences else 0.0,
                    "method": "paddleocr",
                }

            # RapidOCR fallback path.
            result, _ = self.rapid_ocr(input_path)
            if temp_file_path:
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass

            if not result:
                return {
                    "success": False,
                    "error": "No text detected",
                    "raw_text": "",
                    "method": "rapidocr",
                }

            texts = []
            confidences = []
            bounding_boxes = []

            for line in result:
                # RapidOCR line format: [bbox, text, score]
                if not isinstance(line, (list, tuple)) or len(line) < 3:
                    continue
                bbox, text, confidence = line[0], line[1], line[2]
                texts.append(str(text))
                confidences.append(float(confidence))
                bounding_boxes.append(bbox)

            return {
                "success": True,
                "raw_text": " ".join(texts),
                "structured_text": texts,
                "confidence_scores": confidences,
                "bounding_boxes": bounding_boxes,
                "average_confidence": float(np.mean(confidences)) if confidences else 0.0,
                "method": "rapidocr",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_text": "",
                "method": "paddleocr",
            }


_paddle_service = None


def get_paddle_service() -> PaddleOCRService:
    """Get singleton PaddleOCR service instance."""
    global _paddle_service
    if _paddle_service is None:
        _paddle_service = PaddleOCRService()
    return _paddle_service
