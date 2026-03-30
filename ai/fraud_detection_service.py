"""
Fraud detection service for tampering and AI-generation signals.
"""

import os
from typing import Any, Dict

import cv2
import numpy as np


class FraudDetectionService:
    def analyze(self, image_path: str) -> Dict[str, Any]:
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": f"Could not read image: {image_path}"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blocks = self._jpeg_blockiness(gray)
        noise = self._noise_level(gray)
        saturation_ratio = float(np.mean(gray >= 250))
        entropy = self._entropy(gray)
        edge_density = self._edge_density(gray)
        metadata_present = self._has_metadata(image_path)

        # Normalize into risk contributions (0..1), calibrated for document photos/scans.
        blockiness_risk = np.clip((blocks - 32.0) / 28.0, 0.0, 1.0)
        noise_risk = np.clip((8.0 - noise) / 8.0, 0.0, 1.0)
        saturation_risk = np.clip((saturation_ratio - 0.11) / 0.15, 0.0, 1.0)
        entropy_risk = np.clip((5.1 - entropy) / 1.6, 0.0, 1.0)
        edge_risk = np.clip((0.03 - edge_density) / 0.02, 0.0, 1.0)

        suspicious_score = float(
            (0.32 * blockiness_risk)
            + (0.22 * noise_risk)
            + (0.14 * saturation_risk)
            + (0.18 * entropy_risk)
            + (0.14 * edge_risk)
        )

        strong_signals = 0
        strong_signals += 1 if blocks > 58 else 0
        strong_signals += 1 if noise < 4.8 else 0
        strong_signals += 1 if saturation_ratio > 0.22 else 0
        strong_signals += 1 if entropy < 4.2 else 0
        strong_signals += 1 if edge_density < 0.014 else 0

        medium_signals = 0
        medium_signals += 1 if blocks > 46 else 0
        medium_signals += 1 if noise < 6.2 else 0
        medium_signals += 1 if saturation_ratio > 0.15 else 0
        medium_signals += 1 if entropy < 4.9 else 0
        medium_signals += 1 if edge_density < 0.022 else 0

        likely_real_texture = (noise > 7.0 and entropy > 5.4) or (edge_density > 0.06)
        likely_scanned_real = blocks > 55 and noise > 7.0 and entropy > 5.0 and saturation_ratio < 0.12

        suspicious = ((suspicious_score >= 0.86 and strong_signals >= 3) or (strong_signals >= 4))
        if (likely_real_texture or likely_scanned_real) and strong_signals < 4:
            suspicious = False
        if suspicious and metadata_present and strong_signals < 4 and suspicious_score < 0.92:
            suspicious = False

        if suspicious:
            risk_level = "high"
        elif suspicious_score >= 0.67 or medium_signals >= 2:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "success": True,
            "is_suspicious": bool(suspicious),
            "suspicious_score": float(suspicious_score),
            "risk_level": risk_level,
            "review_recommended": risk_level == "medium",
            "signals": {
                "jpeg_blockiness": float(blocks),
                "noise_level": float(noise),
                "saturation_ratio": float(saturation_ratio),
                "entropy": float(entropy),
                "edge_density": float(edge_density),
                "strong_signal_count": int(strong_signals),
                "medium_signal_count": int(medium_signals),
                "metadata_present": metadata_present,
            },
            "reason": self._reason(
                suspicious=suspicious,
                score=suspicious_score,
                blockiness=blocks,
                noise=noise,
                entropy=entropy,
                edge_density=edge_density,
                strong_signals=strong_signals,
                risk_level=risk_level,
            ),
        }

    @staticmethod
    def _jpeg_blockiness(gray: np.ndarray) -> float:
        h, w = gray.shape
        if h < 16 or w < 16:
            return 0.0
        vertical = np.abs(np.diff(gray[:, ::8], axis=1)).mean() if w >= 16 else 0.0
        horizontal = np.abs(np.diff(gray[::8, :], axis=0)).mean() if h >= 16 else 0.0
        return float((vertical + horizontal) / 2.0)

    @staticmethod
    def _noise_level(gray: np.ndarray) -> float:
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        residual = gray.astype(np.float32) - blur.astype(np.float32)
        return float(np.std(residual))

    @staticmethod
    def _entropy(gray: np.ndarray) -> float:
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        prob = hist / max(float(np.sum(hist)), 1.0)
        prob = prob[prob > 0]
        return float(-np.sum(prob * np.log2(prob)))

    @staticmethod
    def _edge_density(gray: np.ndarray) -> float:
        edges = cv2.Canny(gray, 60, 140)
        return float(np.mean(edges > 0))

    @staticmethod
    def _has_metadata(image_path: str) -> bool:
        # Minimal placeholder heuristic.
        return os.path.getsize(image_path) > 32_000

    @staticmethod
    def _reason(
        suspicious: bool,
        score: float,
        blockiness: float,
        noise: float,
        entropy: float,
        edge_density: float,
        strong_signals: int,
        risk_level: str,
    ) -> str:
        if suspicious:
            return (
                f"High synthetic-risk pattern: score={score:.2f}, "
                f"signals={strong_signals}, blockiness={blockiness:.2f}, noise={noise:.2f}"
            )
        if risk_level == "medium":
            return (
                f"Some tampering indicators present but below rejection threshold "
                f"(score={score:.2f}, entropy={entropy:.2f}, edges={edge_density:.3f})"
            )
        return "Low fraud indicators"


_fraud_service = None


def get_fraud_detection_service() -> FraudDetectionService:
    global _fraud_service
    if _fraud_service is None:
        _fraud_service = FraudDetectionService()
    return _fraud_service
