\
\
   

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
                                  
    AADHAAR = "aadhaar"
    PAN = "pan"
    DRIVING_LICENSE = "driving_license"
    PASSPORT = "passport"
    VOTER_ID = "voter_id"
    BILL = "bill"


class ProcessingStatus(str, Enum):
                                 
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"


                

class ProcessDocumentRequest(BaseModel):
                                       
    document_id: str = Field(..., description="Unique document ID")
    document_type: DocumentType = Field(..., description="Type of document")
    use_gemini: bool = Field(True, description="Deprecated flag (PaddleOCR is used)")
    detect_face: bool = Field(True, description="Perform face detection")


class VerifyFacesRequest(BaseModel):
                                                    
    document_image_id: str = Field(..., description="Document image ID")
    live_photo_id: str = Field(..., description="Live photo ID")
    tolerance: float = Field(0.6, description="Face matching tolerance (0-1, lower is stricter)")


class ValidateDataRequest(BaseModel):
                                           
    document_data: Dict[str, Any] = Field(..., description="Document data to validate")
    document_type: DocumentType = Field(..., description="Type of document")


class ManualCrossCheckRequest(BaseModel):
                                                                      
    document_id: str = Field(..., description="Unique document ID")
    document_type: DocumentType = Field(..., description="Type of document")
    entered_name: Optional[str] = Field(None, description="Name entered by user")
    entered_id: Optional[str] = Field(None, description="ID number entered by user")


                 

class UploadResponse(BaseModel):
                                        
    success: bool
    document_id: str
    filename: str
    upload_timestamp: str
    file_path: str
    message: Optional[str] = None


class ProcessingJobResponse(BaseModel):
                                                 
    success: bool
    job_id: str
    status: ProcessingStatus
    message: str
    started_at: Optional[str] = None


class JobStatusResponse(BaseModel):
                                       
    success: bool
    job_id: str
    status: ProcessingStatus
    progress: int = Field(..., ge=0, le=100, description="Progress percentage")
    message: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class OCRResult(BaseModel):
                               
    method: str
    success: bool
    raw_text: Optional[str] = None
    raw_response: Optional[str] = None
    confidence_scores: Optional[List[float]] = None
    average_confidence: Optional[float] = None


class ValidationResult(BaseModel):
                                    
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    validation_details: Optional[Dict[str, Any]] = None


class FaceDetectionResult(BaseModel):
                               
    face_count: int
    primary_face_encoding: Optional[List[float]] = None
    quality: Optional[Dict[str, Any]] = None
    liveness: Optional[Dict[str, Any]] = None


class DocumentResultResponse(BaseModel):
                                             
    success: bool
    document_id: str
    document_type: str
    overall_status: ProcessingStatus
    timestamp: str
    parsed_data: Dict[str, Any]
    ocr_result: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    face_detection: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, Any]] = None
    gemini_validation: Optional[Dict[str, Any]] = None
    errors: List[str] = []
    warnings: List[str] = []


class FaceVerificationResponse(BaseModel):
                                  
    success: bool
    faces_match: bool
    similarity_percentage: float
    face_distance: float
    confidence: str
    liveness_check: Optional[Dict[str, Any]] = None
    timestamp: str
    error: Optional[str] = None


class HealthResponse(BaseModel):
                               
    status: str
    timestamp: str
    services: Dict[str, str]
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
                        
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: str


class SupportedTypesResponse(BaseModel):
                                                   
    supported_types: List[Dict[str, Any]]


class ReportResponse(BaseModel):
                                    
    success: bool
    document_id: str
    report: str
    generated_at: str
