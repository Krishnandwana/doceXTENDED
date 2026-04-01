\
\
   

from typing import Any, Dict

from .confidence_calibrator import calibrate_component_scores


def fuse_results(components: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    weights = {
        "ocr": 0.25,
        "parser": 0.25,
        "classifier": 0.15,
        "face_match": 0.20,
        "quality": 0.15,
    }
    raw_scores = {
        name: float(payload.get("confidence", 0.0))
        for name, payload in components.items()
    }
    calibrated = calibrate_component_scores(raw_scores)

    fused = 0.0
    norm = 0.0
    for name, score in calibrated.items():
        w = weights.get(name, 0.0)
        fused += score * w
        norm += w
    fused_conf = fused / norm if norm > 0 else 0.0

    return {
        "success": True,
        "fused_confidence": float(fused_conf),
        "component_confidence": calibrated,
        "decision": "approve" if fused_conf >= 0.70 else "review" if fused_conf >= 0.45 else "reject",
    }

