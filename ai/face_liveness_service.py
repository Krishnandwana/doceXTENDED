"""
Face liveness service.
Baseline anti-spoof heuristics for single-frame and multi-frame inputs.
"""

from typing import Any, Dict, List

import cv2
import numpy as np


class FaceLivenessService:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    def analyze_single_frame(self, image_path: str) -> Dict[str, Any]:
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": f"Could not read image: {image_path}"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            return {"success": False, "error": "No face detected", "is_live": False}

        x, y, w, h = faces[0]
        roi = gray[y:y + h, x:x + w]
        lap_var = float(cv2.Laplacian(roi, cv2.CV_64F).var())
        edges = cv2.Canny(roi, 80, 160)
        edge_density = float(np.mean(edges > 0))
        highlight_ratio = float(np.mean(roi > 245))

        # Simple heuristics: live faces usually show textured skin and moderate highlights.
        live_score = 0.0
        live_score += min(lap_var / 300.0, 1.0) * 0.45
        live_score += min(edge_density / 0.2, 1.0) * 0.35
        live_score += max(0.0, 1.0 - (highlight_ratio / 0.25)) * 0.20
        is_live = live_score >= 0.55

        return {
            "success": True,
            "is_live": bool(is_live),
            "confidence": float(live_score),
            "metrics": {
                "laplacian_variance": lap_var,
                "edge_density": edge_density,
                "highlight_ratio": highlight_ratio,
            },
            "attack_signals": {
                "possible_screen_replay": highlight_ratio > 0.18,
                "possible_print_attack": lap_var < 80.0,
            },
        }

    def analyze_frame_sequence(self, frame_paths: List[str]) -> Dict[str, Any]:
        if len(frame_paths) < 2:
            return {
                "success": False,
                "error": "At least two frames are required for sequence analysis",
            }

        flows = []
        prev = None
        for path in frame_paths:
            frame = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            if frame is None:
                continue
            if prev is not None:
                flow = cv2.calcOpticalFlowFarneback(
                    prev, frame, None, 0.5, 3, 15, 3, 5, 1.2, 0
                )
                mag = np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2)
                flows.append(float(np.mean(mag)))
            prev = frame

        if not flows:
            return {"success": False, "error": "Unable to compute frame motion"}

        motion_score = float(np.mean(flows))
        motion_var = float(np.var(flows))
        likely_live = motion_score > 0.25 and motion_var > 0.001
        return {
            "success": True,
            "is_live": bool(likely_live),
            "confidence": min(1.0, motion_score),
            "metrics": {
                "avg_motion": motion_score,
                "motion_variance": motion_var,
                "frame_pairs": len(flows),
            },
        }


_liveness_service = None


def get_face_liveness_service() -> FaceLivenessService:
    global _liveness_service
    if _liveness_service is None:
        _liveness_service = FaceLivenessService()
    return _liveness_service

