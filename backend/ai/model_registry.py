\
\
   

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class ModelRegistry:
    models: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        "ocr": {"provider": "paddleocr", "version": "2.x"},
        "face_embedding": {"provider": "facenet", "version": "vggface2"},
        "face_detector": {"provider": "mtcnn", "version": "facenet-pytorch"},
        "doc_classifier": {"provider": "rule_hybrid", "version": "1.0"},
        "fraud_detector": {"provider": "heuristic", "version": "1.0"},
    })
    thresholds: Dict[str, float] = field(default_factory=lambda: {
        "face_match_cosine": 0.65,
        "min_similarity_percent": 50.0,
        "min_blur_score": 90.0,
        "max_glare_ratio": 0.18,
        "min_resolution_megapixels": 0.6,
    })
    feature_flags: Dict[str, bool] = field(default_factory=lambda: {
        "enable_quality_gate": True,
        "enable_fraud_checks": True,
        "enable_liveness_check": True,
        "enable_doc_autoclassification": True,
    })

    def get_model(self, key: str) -> Dict[str, Any]:
        return self.models.get(key, {})

    def get_threshold(self, key: str, default: float = 0.0) -> float:
        value = self.thresholds.get(key, default)
        return float(value)

    def is_enabled(self, flag: str, default: bool = False) -> bool:
        return bool(self.feature_flags.get(flag, default))


_registry = None


def get_model_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry

