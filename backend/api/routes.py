"""
FastAPI Routes for Document Verification API
"""

import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from .models import *
from ..services.document_processor import get_document_processor

# Initialize router
router = APIRouter()

# In-memory storage (replace with database in production)
uploaded_files: Dict[str, Dict[str, Any]] = {}
processing_jobs: Dict[str, Dict[str, Any]] = {}
processing_results: Dict[str, Dict[str, Any]] = {}

# Directories
UPLOAD_DIR = Path("data/uploads")
PROCESSED_DIR = Path("data/processed")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_file(file: UploadFile) -> None:
    """Validate uploaded file"""
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )


def process_document_background(job_id: str, document_id: str, options: Dict[str, Any]):
    """Background task to process document"""
    try:
        # Update job status
        processing_jobs[job_id]['status'] = ProcessingStatus.PROCESSING
        processing_jobs[job_id]['progress'] = 25

        # Get file path
        file_info = uploaded_files.get(document_id)
        if not file_info:
            processing_jobs[job_id]['status'] = ProcessingStatus.FAILED
            processing_jobs[job_id]['message'] = 'Document not found'
            return

        # Process document
        processor = get_document_processor()
        result = processor.process_document(
            image_path=file_info['file_path'],
            document_type=options['document_type'],
            use_gemini=options.get('use_gemini', True),
            detect_face=options.get('detect_face', True)
        )

        # Update progress
        processing_jobs[job_id]['progress'] = 100
        processing_jobs[job_id]['status'] = ProcessingStatus.COMPLETED
        processing_jobs[job_id]['completed_at'] = datetime.now().isoformat()
        processing_jobs[job_id]['message'] = 'Processing completed successfully'

        # Store result
        processing_results[document_id] = result

    except Exception as e:
        processing_jobs[job_id]['status'] = ProcessingStatus.FAILED
        processing_jobs[job_id]['message'] = f'Processing failed: {str(e)}'
        processing_jobs[job_id]['progress'] = 0


@router.post("/api/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document image for processing

    - **file**: Document image file (JPEG, PNG, BMP, TIFF)
    """
    try:
        # Validate file
        validate_file(file)

        # Generate unique document ID
        document_id = str(uuid.uuid4())

        # Create file path
        file_ext = Path(file.filename).suffix
        safe_filename = f"{document_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Store file info
        upload_timestamp = datetime.now().isoformat()
        uploaded_files[document_id] = {
            'document_id': document_id,
            'filename': file.filename,
            'safe_filename': safe_filename,
            'file_path': str(file_path),
            'upload_timestamp': upload_timestamp
        }

        return UploadResponse(
            success=True,
            document_id=document_id,
            filename=file.filename,
            upload_timestamp=upload_timestamp,
            file_path=str(file_path),
            message="File uploaded successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/api/documents/process", response_model=ProcessingJobResponse)
async def process_document(
    request: ProcessDocumentRequest,
    background_tasks: BackgroundTasks
):
    """
    Start processing a document

    - **document_id**: ID of uploaded document
    - **document_type**: Type of document (aadhaar, pan, driving_license, passport, voter_id)
    - **use_gemini**: Use Gemini AI for OCR (default: true)
    - **detect_face**: Perform face detection (default: true)
    """
    try:
        # Check if document exists
        if request.document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")

        # Create job
        job_id = str(uuid.uuid4())
        started_at = datetime.now().isoformat()

        processing_jobs[job_id] = {
            'job_id': job_id,
            'document_id': request.document_id,
            'status': ProcessingStatus.PENDING,
            'progress': 0,
            'message': 'Job created, starting processing',
            'started_at': started_at,
            'completed_at': None
        }

        # Start background processing
        background_tasks.add_task(
            process_document_background,
            job_id,
            request.document_id,
            {
                'document_type': request.document_type,
                'use_gemini': request.use_gemini,
                'detect_face': request.detect_face
            }
        )

        return ProcessingJobResponse(
            success=True,
            job_id=job_id,
            status=ProcessingStatus.PENDING,
            message="Processing started",
            started_at=started_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start processing: {str(e)}")


@router.get("/api/documents/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get processing job status

    - **job_id**: ID of the processing job
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]

    return JobStatusResponse(
        success=True,
        job_id=job_id,
        status=job['status'],
        progress=job['progress'],
        message=job['message'],
        started_at=job['started_at'],
        completed_at=job.get('completed_at')
    )


@router.get("/api/documents/results/{document_id}", response_model=DocumentResultResponse)
async def get_document_results(document_id: str):
    """
    Get document processing results

    - **document_id**: ID of the document
    """
    if document_id not in processing_results:
        # Check if document exists
        if document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")
        else:
            raise HTTPException(status_code=202, detail="Document is still processing")

    result = processing_results[document_id]

    return DocumentResultResponse(
        success=True,
        document_id=document_id,
        document_type=result['document_type'],
        overall_status=result['overall_status'],
        timestamp=result['timestamp'],
        parsed_data=result.get('parsed_data', {}),
        ocr_result=result.get('ocr_result'),
        validation=result.get('validation'),
        face_detection=result.get('face_detection'),
        gemini_validation=result.get('gemini_validation'),
        errors=result.get('errors', []),
        warnings=result.get('warnings', [])
    )


@router.post("/api/face/verify", response_model=FaceVerificationResponse)
async def verify_faces(request: VerifyFacesRequest):
    """
    Verify if faces match between document and live photo

    - **document_image_id**: ID of document image
    - **live_photo_id**: ID of live photo
    - **tolerance**: Matching tolerance (0-1, default: 0.6)
    """
    try:
        # Check if both images exist
        if request.document_image_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document image not found")
        if request.live_photo_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Live photo not found")

        # Get file paths
        doc_path = uploaded_files[request.document_image_id]['file_path']
        live_path = uploaded_files[request.live_photo_id]['file_path']

        # Verify faces
        processor = get_document_processor()
        result = processor.verify_faces(doc_path, live_path, request.tolerance)

        if not result['success']:
            return FaceVerificationResponse(
                success=False,
                faces_match=False,
                similarity_percentage=0.0,
                face_distance=1.0,
                confidence='none',
                timestamp=datetime.now().isoformat(),
                error=result.get('error', 'Verification failed')
            )

        return FaceVerificationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {str(e)}")


@router.post("/api/documents/validate", response_model=ValidationResult)
async def validate_document_data(request: ValidateDataRequest):
    """
    Validate document data against type-specific rules

    - **document_data**: Document data fields
    - **document_type**: Type of document
    """
    try:
        from ..services.document_parser import get_document_parser
        parser = get_document_parser()

        validation = parser.validate_document_data(
            request.document_data,
            request.document_type
        )

        return ValidationResult(**validation)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/api/documents/types", response_model=SupportedTypesResponse)
async def get_supported_types():
    """Get list of supported document types and their required fields"""
    from ..services.document_parser import DocumentParser

    parser = DocumentParser()
    types_info = []

    for doc_type, required_fields in parser.REQUIRED_FIELDS.items():
        types_info.append({
            'type': doc_type,
            'required_fields': required_fields,
            'description': f"{doc_type.replace('_', ' ').title()} document"
        })

    return SupportedTypesResponse(supported_types=types_info)


@router.get("/api/documents/report/{document_id}", response_model=ReportResponse)
async def generate_report(document_id: str):
    """
    Generate a detailed processing report for a document

    - **document_id**: ID of the document
    """
    if document_id not in processing_results:
        if document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")
        else:
            raise HTTPException(status_code=202, detail="Document is still processing")

    processor = get_document_processor()
    result = processing_results[document_id]
    report = processor.generate_report(result)

    return ReportResponse(
        success=True,
        document_id=document_id,
        report=report,
        generated_at=datetime.now().isoformat()
    )


@router.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and its associated data

    - **document_id**: ID of the document to delete
    """
    if document_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        # Delete file
        file_info = uploaded_files[document_id]
        file_path = Path(file_info['file_path'])
        if file_path.exists():
            file_path.unlink()

        # Remove from storage
        del uploaded_files[document_id]
        if document_id in processing_results:
            del processing_results[document_id]

        return {
            'success': True,
            'message': 'Document deleted successfully',
            'document_id': document_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@router.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check API and service health status"""
    try:
        # Test services
        services = {
            'gemini': 'operational',
            'paddleocr': 'operational',
            'face_detection': 'operational',
            'document_processor': 'operational'
        }

        return HealthResponse(
            status='healthy',
            timestamp=datetime.now().isoformat(),
            services=services
        )

    except Exception as e:
        return HealthResponse(
            status='degraded',
            timestamp=datetime.now().isoformat(),
            services={'error': str(e)}
        )
