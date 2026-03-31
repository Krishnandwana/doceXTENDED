\
\
   

__all__ = [
    "get_document_classifier",
    "get_face_liveness_service",
    "get_fraud_detection_service",
    "get_face_service",
    "get_secondry_ocr_service",
    "get_model_registry",
    "get_name_id_extractor",
    "get_paddle_service",
    "get_quality_assessment_service",
]


def get_paddle_service():
    from .paddle_ocr_service import get_paddle_service as _fn
    return _fn()


def get_face_service():
    from .face_detection_service import get_face_service as _fn
    return _fn()


def get_secondry_ocr_service():
    from .secondry_ocr_service import get_secondry_ocr_service as _fn
    return _fn()


def get_document_classifier():
    from .document_classifier import get_document_classifier as _fn
    return _fn()


def get_face_liveness_service():
    from .face_liveness_service import get_face_liveness_service as _fn
    return _fn()


def get_fraud_detection_service():
    from .fraud_detection_service import get_fraud_detection_service as _fn
    return _fn()


def get_quality_assessment_service():
    from .quality_assessment_service import get_quality_assessment_service as _fn
    return _fn()


def get_name_id_extractor():
    from .name_id_extractor import get_name_id_extractor as _fn
    return _fn()


def get_model_registry():
    from .model_registry import get_model_registry as _fn
    return _fn()
