"""
Pydantic Models for API Request/Response
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """Supported document types"""
    AADHAAR = "aadhaar"
    PAN = "pan"
    DRIVING_LICENSE = "driving_license"
    PASSPORT = "passport"
    VOTER_ID = "voter_id"


class ProcessingStatus(str, Enum):
    """Processing job statuses"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"


# Request Models

class ProcessDocumentRequest(BaseModel):
    """Request to process a document"""
    document_id: str = Field(..., description="Unique document ID")
    document_type: DocumentType = Field(..., description="Type of document")
    use_gemini: bool = Field(True, description="Use Gemini AI for OCR (fallback to PaddleOCR if False)")
    detect_face: bool = Field(True, description="Perform face detection")


class VerifyFacesRequest(BaseModel):
    """Request to verify faces between two images"""
    document_image_id: str = Field(..., description="Document image ID")
    live_photo_id: str = Field(..., description="Live photo ID")
    tolerance: float = Field(0.6, description="Face matching tolerance (0-1, lower is stricter)")


class ValidateDataRequest(BaseModel):
    """Request to validate document data"""
    document_data: Dict[str, Any] = Field(..., description="Document data to validate")
    document_type: DocumentType = Field(..., description="Type of document")


# Response Models

class UploadResponse(BaseModel):
    """Response after document upload"""
    success: bool
    document_id: str
    filename: str
    upload_timestamp: str
    file_path: str
    message: Optional[str] = None


class ProcessingJobResponse(BaseModel):
    """Response when processing job is created"""
    success: bool
    job_id: str
    status: ProcessingStatus
    message: str
    started_at: Optional[str] = None


class JobStatusResponse(BaseModel):
    """Response for job status check"""
    success: bool
    job_id: str
    status: ProcessingStatus
    progress: int = Field(..., ge=0, le=100, description="Progress percentage")
    message: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class OCRResult(BaseModel):
    """OCR extraction result"""
    method: str
    success: bool
    raw_text: Optional[str] = None
    raw_response: Optional[str] = None
    confidence_scores: Optional[List[float]] = None
    average_confidence: Optional[float] = None


class ValidationResult(BaseModel):
    """Document validation result"""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    validation_details: Optional[Dict[str, Any]] = None


class FaceDetectionResult(BaseModel):
    """Face detection result"""
    face_count: int
    primary_face_encoding: Optional[List[float]] = None
    quality: Optional[Dict[str, Any]] = None
    liveness: Optional[Dict[str, Any]] = None


class DocumentResultResponse(BaseModel):
    """Complete document processing result"""
    success: bool
    document_id: str
    document_type: str
    overall_status: ProcessingStatus
    timestamp: str
    parsed_data: Dict[str, Any]
    ocr_result: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    face_detection: Optional[Dict[str, Any]] = None
    gemini_validation: Optional[Dict[str, Any]] = None
    errors: List[str] = []
    warnings: List[str] = []


class FaceVerificationResponse(BaseModel):
    """Face verification result"""
    success: bool
    faces_match: bool
    similarity_percentage: float
    face_distance: float
    confidence: str
    liveness_check: Optional[Dict[str, Any]] = None
    timestamp: str
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: str


class SupportedTypesResponse(BaseModel):
    """Response listing supported document types"""
    supported_types: List[Dict[str, Any]]


class ReportResponse(BaseModel):
    """Document processing report"""
    success: bool
    document_id: str
    report: str
    generated_at: str
