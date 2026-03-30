"""
Quality assessment for document and face capture.
"""

from typing import Any, Dict

import cv2
import numpy as np


class QualityAssessmentService:
    def assess(self, image_path: str) -> Dict[str, Any]:
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": f"Could not read image: {image_path}"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        megapixels = (h * w) / 1_000_000.0
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(np.mean(gray))
        glare_ratio = float(np.mean(gray >= 245))
        contrast = float(np.std(gray))

        face_vis = self._face_visibility(gray)
        score = self._quality_score(megapixels, blur_score, brightness, glare_ratio, contrast, face_vis)

        return {
            "success": True,
            "is_good_quality": score >= 0.60,
            "quality_score": score,
            "metrics": {
                "megapixels": float(megapixels),
                "blur_score": blur_score,
                "brightness": brightness,
                "glare_ratio": glare_ratio,
                "contrast": contrast,
                "face_visibility": face_vis,
            },
        }

    @staticmethod
    def _face_visibility(gray: np.ndarray) -> float:
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        if len(faces) == 0:
            return 0.0
        _, _, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        area_ratio = (w * h) / (gray.shape[0] * gray.shape[1])
        return float(min(area_ratio * 8.0, 1.0))

    @staticmethod
    def _quality_score(
        megapixels: float,
        blur_score: float,
        brightness: float,
        glare_ratio: float,
        contrast: float,
        face_visibility: float,
    ) -> float:
        res_term = min(megapixels / 1.0, 1.0) * 0.20
        blur_term = min(blur_score / 150.0, 1.0) * 0.30
        brightness_term = max(0.0, 1.0 - abs(brightness - 130.0) / 130.0) * 0.15
        glare_term = max(0.0, 1.0 - glare_ratio / 0.2) * 0.10
        contrast_term = min(contrast / 70.0, 1.0) * 0.15
        face_term = face_visibility * 0.10
        return float(min(res_term + blur_term + brightness_term + glare_term + contrast_term + face_term, 1.0))


_quality_service = None


def get_quality_assessment_service() -> QualityAssessmentService:
    global _quality_service
    if _quality_service is None:
        _quality_service = QualityAssessmentService()
    return _quality_service

