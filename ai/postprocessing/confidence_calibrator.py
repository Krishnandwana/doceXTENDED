"""
Confidence calibration helpers.
"""

from typing import Dict


def calibrate_confidence(raw_score: float, method: str = "linear") -> float:
    score = max(0.0, min(1.0, float(raw_score)))
    if method == "sigmoid":
        # Cheap approximation around mid-range.
        return max(0.0, min(1.0, 1.0 / (1.0 + pow(2.71828, -8 * (score - 0.5)))))
    if method == "piecewise":
        if score < 0.4:
            return score * 0.7
        if score < 0.7:
            return 0.28 + (score - 0.4) * 1.1
        return min(1.0, 0.61 + (score - 0.7) * 1.3)
    return score


def calibrate_component_scores(component_scores: Dict[str, float]) -> Dict[str, float]:
    return {k: calibrate_confidence(v, method="piecewise") for k, v in component_scores.items()}

