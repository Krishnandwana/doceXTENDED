"""
Services Package
"""

from .paddle_ocr_service import get_paddle_service
from .document_parser import get_document_parser
from .document_processor import get_document_processor

__all__ = [
    'get_paddle_service',
    'get_document_parser',
    'get_document_processor'
]
