"""
Services Package
"""

from .gemini_ocr_service import get_gemini_service
from .paddle_ocr_service import get_paddle_service
from .document_parser import get_document_parser
from .face_detection_service import get_face_service
from .document_processor import get_document_processor

__all__ = [
    'get_gemini_service',
    'get_paddle_service',
    'get_document_parser',
    'get_face_service',
    'get_document_processor'
]
