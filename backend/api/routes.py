\
\
   

import os
import uuid
import shutil
import tempfile
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
import cv2
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from ai.face_liveness_service import get_face_liveness_service
from ai.fraud_detection_service import get_fraud_detection_service
from ai.secondry_ocr_service import get_secondry_ocr_service
from ai.quality_assessment_service import get_quality_assessment_service
from .models import *
from ..services.document_processor import get_document_processor

                   
router = APIRouter()

                                                         
uploaded_files: Dict[str, Dict[str, Any]] = {}
processing_jobs: Dict[str, Dict[str, Any]] = {}
processing_results: Dict[str, Dict[str, Any]] = {}

             
UPLOAD_DIR = Path("data/uploads")
PROCESSED_DIR = Path("data/processed")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

                         
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024         


def _looks_like_person_name(value: str) -> bool:
    if not value:
        return False
    text = value.strip().lower()
    blocked = (
        "permanent account number",
        "account number",
        "government of india",
        "income tax",
        "tax department",
        "department",
        "republic of india",
        "election commission",
        "card",
        "signature",
    )
    if any(token in text for token in blocked):
        return False
    if any(ch.isdigit() for ch in text):
        return False
    return len(text.split()) >= 2


def _normalize_name_for_match(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z\s]", " ", str(value or ""))
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()
    return cleaned


def _normalize_id_for_match(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", str(value or "")).upper()


def _name_exists_in_ocr(entered_name: str, ocr_lines: list[str]) -> bool:
    if not entered_name:
        return False
    normalized_input = _normalize_name_for_match(entered_name)
    if not normalized_input:
        return False

    input_tokens = [t for t in normalized_input.split() if t]
    if not input_tokens:
        return False

    for line in ocr_lines:
        norm_line = _normalize_name_for_match(line)
        if not norm_line:
            continue
        if normalized_input in norm_line or norm_line in normalized_input:
            return True
        matched_tokens = sum(1 for t in input_tokens if t in norm_line)
        if matched_tokens >= max(2, len(input_tokens) - 1):
            return True
    return False


def _id_exists_in_ocr(entered_id: str, ocr_text: str) -> bool:
    if not entered_id:
        return False
    normalized_input = _normalize_id_for_match(entered_id)
    if not normalized_input:
        return False
    normalized_ocr = _normalize_id_for_match(ocr_text)
    if not normalized_ocr:
        return False
    if normalized_input in normalized_ocr:
        return True
                                                                                   
    if len(normalized_input) >= 8:
        overlap = sum(1 for a, b in zip(normalized_input, normalized_ocr) if a == b)
        return overlap >= int(len(normalized_input) * 0.8)
    return False


def _resolve_document_path(document_id: str) -> str:
                                                             
    if document_id in uploaded_files:
        return uploaded_files[document_id]['file_path']

    print(f"[Resolve] Document not in memory, checking disk for: {document_id}")
    possible_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    for ext in possible_extensions:
        potential_path = UPLOAD_DIR / f"{document_id}{ext}"
        if potential_path.exists():
            print(f"[Resolve] Found document on disk: {potential_path}")
            return str(potential_path)
    raise HTTPException(status_code=404, detail="Document not found in memory or on disk")


def validate_file(file: UploadFile) -> None:
                                
                          
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )


def process_document_background(job_id: str, document_id: str, options: Dict[str, Any]):
                                             
    try:
        print(f"\n{'='*60}")
        print(f"[Processing] STARTING BACKGROUND TASK")
        print(f"[Processing] Job ID: {job_id}")
        print(f"[Processing] Document ID: {document_id}")
        print(f"[Processing] Options: {options}")
        print(f"{'='*60}\n")
        
                           
        processing_jobs[job_id]['status'] = ProcessingStatus.PROCESSING
        processing_jobs[job_id]['progress'] = 25
        
        print(f"[Processing] Starting job {job_id} for document {document_id}")

                       
        file_info = uploaded_files.get(document_id)
        if not file_info:
            processing_jobs[job_id]['status'] = ProcessingStatus.FAILED
            processing_jobs[job_id]['message'] = 'Document not found'
            print(f"[Processing] ERROR: Document {document_id} not found")
            return

        print(f"[Processing] Processing document at: {file_info['file_path']}")
        processing_jobs[job_id]['progress'] = 40

                          
        processor = get_document_processor()
        result = processor.process_document(
            image_path=file_info['file_path'],
            document_type=options['document_type'],
            use_gemini=options.get('use_gemini', True),
            detect_face=options.get('detect_face', True)
        )
        
        print(f"[Processing] Document processed successfully. Status: {result.get('overall_status')}")

                                                
        if result.get('overall_status') == 'failed':
            processing_jobs[job_id]['status'] = ProcessingStatus.FAILED
            error_messages = result.get('errors', [])
            processing_jobs[job_id]['message'] = ' '.join(error_messages) if error_messages else 'Processing failed'
            processing_jobs[job_id]['progress'] = 0
            print(f"[Processing] Job {job_id} failed: {processing_jobs[job_id]['message']}")
            return

                         
        processing_jobs[job_id]['progress'] = 100
        processing_jobs[job_id]['status'] = ProcessingStatus.COMPLETED
        processing_jobs[job_id]['completed_at'] = datetime.now().isoformat()
        processing_jobs[job_id]['message'] = 'Processing completed successfully'

                      
        processing_results[document_id] = result
        print(f"[Processing] Job {job_id} completed successfully")

    except Exception as e:
        print(f"[Processing] ERROR in job {job_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        processing_jobs[job_id]['status'] = ProcessingStatus.FAILED
        processing_jobs[job_id]['message'] = f'Processing failed: {str(e)}'
        processing_jobs[job_id]['progress'] = 0


@router.post("/api/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
\
\
\
\
       
    try:
                       
        validate_file(file)

                                     
        document_id = str(uuid.uuid4())

                          
        file_ext = Path(file.filename).suffix
        safe_filename = f"{document_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename

                   
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

                         
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
\
\
\
\
\
\
\
       
    try:
                                  
        if request.document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")

                    
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
\
\
\
\
       
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
\
\
\
\
       
    if document_id not in processing_results:
                                  
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
        gemini_validation=result.get('gemini_validation'),
        analysis=result.get('analysis'),
        errors=result.get('errors', []),
        warnings=result.get('warnings', [])
    )


@router.post("/api/documents/validate", response_model=ValidationResult)
async def validate_document_data(request: ValidateDataRequest):
\
\
\
\
\
       
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
\
                                                                     
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
\
\
\
\
       
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
\
\
\
\
       
    if document_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
                     
        file_info = uploaded_files[document_id]
        file_path = Path(file_info['file_path'])
        if file_path.exists():
            file_path.unlink()

                             
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


@router.post("/api/documents/{document_id}/authenticity")
async def check_document_authenticity(document_id: str):
\
\
\
\
\
       
    try:
                                
        if document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")
        
        file_info = uploaded_files[document_id]
        file_path = file_info['file_path']
        
        fraud_service = get_fraud_detection_service()
        fraud_result = fraud_service.analyze(file_path)

        if fraud_result.get('success'):
            is_suspicious = bool(fraud_result.get('is_suspicious', False))
            suspicious_score = float(fraud_result.get('suspicious_score', 0.0))
            risk_level = str(fraud_result.get('risk_level', 'low'))
            review_recommended = bool(fraud_result.get('review_recommended', False))
            confidence_score = int(round((suspicious_score if is_suspicious else (1.0 - suspicious_score)) * 100))

            return {
                'success': True,
                'document_id': document_id,
                'is_authentic': not is_suspicious,
                'is_ai_generated': is_suspicious,
                'confidence_score': confidence_score,
                'risk_level': risk_level,
                'review_recommended': review_recommended,
                'explanation': fraud_result.get('reason', ''),
                'detection_method': 'ai_fraud_detection_service',
                'signals': fraud_result.get('signals', {}),
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'success': False,
                'error': fraud_result.get('error', 'Authenticity check failed'),
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authenticity check failed: {str(e)}")


@router.post("/api/documents/{document_id}/validate-authenticity")
async def validate_document_authenticity(document_id: str, document_type: str):
\
\
\
\
\
       
    try:
                                
        if document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")
        
        file_info = uploaded_files[document_id]
        file_path = file_info['file_path']
        
        quality_service = get_quality_assessment_service()
        fraud_service = get_fraud_detection_service()
        quality_result = quality_service.assess(file_path)
        fraud_result = fraud_service.analyze(file_path)

        if not quality_result.get('success'):
            return {
                'success': False,
                'error': quality_result.get('error', 'Quality assessment failed'),
                'timestamp': datetime.now().isoformat()
            }

        quality_score = float(quality_result.get('quality_score', 0.0))
        quality_metrics = quality_result.get('metrics', {})
        risk_level = str(fraud_result.get('risk_level', 'low'))
        review_recommended = bool(fraud_result.get('review_recommended', False))
        tampering_detected = bool(fraud_result.get('is_suspicious', False))
        blur_score = float(quality_metrics.get('blur_score', 0.0))
        is_clear = bool(quality_metrics.get('blur_score', 0.0) >= 90.0)
        appears_genuine = not tampering_detected
        note_suffix = " Manual review recommended." if (review_recommended and not tampering_detected) else ""
        validation_data = {
            'is_clear': is_clear,
            'appears_genuine': appears_genuine,
            'tampering_detected': tampering_detected,
            'review_recommended': review_recommended,
            'risk_level': risk_level,
            'format_valid': True,
            'confidence_score': int(round(quality_score * 100)),
            'quality_score': quality_score,
            'quality_metrics': quality_metrics,
            'fraud_signals': fraud_result.get('signals', {}),
            'notes': f'AI validation for {document_type}. Risk={risk_level}. Blur={blur_score:.2f}.{note_suffix}'
        }

        return {
            'success': True,
            'document_id': document_id,
            'is_clear': validation_data['is_clear'],
            'appears_genuine': validation_data['appears_genuine'],
            'tampering_detected': validation_data['tampering_detected'],
            'format_valid': validation_data['format_valid'],
            'confidence_score': validation_data['confidence_score'],
            'notes': validation_data['notes'],
            'validation': validation_data,
            'timestamp': datetime.now().isoformat()
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/api/face/match")
async def match_faces(request: Dict[str, str]):
\
\
\
\
\
       
    try:
        document_id = request.get('document_id')
        selfie_id = request.get('selfie_id')
        
        if not document_id or not selfie_id:
            raise HTTPException(status_code=400, detail="Both document_id and selfie_id are required")
        
                                       
        if document_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Document not found")
        if selfie_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="Selfie not found")
        
        document_path = uploaded_files[document_id]['file_path']
        selfie_path = uploaded_files[selfie_id]['file_path']
        
                                                 
        processor = get_document_processor()
        
                                            
        if not processor.face_service:
            raise HTTPException(status_code=503, detail="Face detection service not available")
        
        result = processor.verify_faces(document_path, selfie_path)
        
        return {
            'success': result.get('success', False),
            'faces_match': result.get('faces_match', False),
            'similarity_percentage': result.get('similarity_percentage', 0),
            'confidence': result.get('confidence', 0),
            'face_distance': result.get('face_distance', 1.0),
            'liveness_check': result.get('liveness_check'),
            'error': result.get('error'),
            'timestamp': datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face matching failed: {str(e)}")


@router.post("/api/face/liveness-video")
async def check_liveness_video(file: UploadFile = File(...)):
\
\
\
\
       
    try:
        ext = Path(file.filename or "liveness.webm").suffix.lower()
        if ext not in {".webm", ".mp4", ".mov", ".m4v"}:
            raise HTTPException(status_code=400, detail="Invalid video type. Allowed: .webm, .mp4, .mov, .m4v")

        video_path = None
        temp_frame_paths = []
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_video:
            video_path = tmp_video.name
            shutil.copyfileobj(file.file, tmp_video)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not read video stream")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration_seconds = float(frame_count / fps) if fps and fps > 0 else 0.0

        if frame_count <= 0:
            cap.release()
            raise HTTPException(status_code=400, detail="Video contains no frames")

                                                             
        samples = min(10, max(2, frame_count))
        indexes = sorted(set(int(i * (frame_count - 1) / (samples - 1)) for i in range(samples)))

        with tempfile.TemporaryDirectory() as frame_dir:
            for idx, frame_index in enumerate(indexes):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                ok, frame = cap.read()
                if not ok or frame is None:
                    continue
                frame_path = str(Path(frame_dir) / f"frame_{idx:02d}.jpg")
                cv2.imwrite(frame_path, frame)
                temp_frame_paths.append(frame_path)
            cap.release()

            if len(temp_frame_paths) < 2:
                raise HTTPException(status_code=400, detail="Insufficient usable frames for liveness analysis")

            liveness_service = get_face_liveness_service()
            sequence_result = liveness_service.analyze_frame_sequence(temp_frame_paths)

                                                                       
            middle_frame = temp_frame_paths[len(temp_frame_paths) // 2]
            single_result = liveness_service.analyze_single_frame(middle_frame)

        if not sequence_result.get("success"):
            raise HTTPException(status_code=400, detail=sequence_result.get("error", "Liveness analysis failed"))

        if not single_result.get("success"):
                                                                      
            single_result = {
                "success": False,
                "is_live": False,
                "confidence": 0.0,
                "error": single_result.get("error", "Single-frame liveness check failed"),
            }

        seq_conf = float(sequence_result.get("confidence", 0.0))
        frm_conf = float(single_result.get("confidence", 0.0))
        combined_conf = min(1.0, max(0.0, (0.65 * seq_conf) + (0.35 * frm_conf)))
        is_live = bool(sequence_result.get("is_live", False) and (single_result.get("is_live", False) or seq_conf >= 0.5))

        return {
            "success": True,
            "is_live": is_live,
            "confidence": round(combined_conf, 4),
            "duration_seconds": round(duration_seconds, 2),
            "frame_count": frame_count,
            "sampled_frames": len(temp_frame_paths),
            "sequence": sequence_result,
            "single_frame": single_result,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liveness video check failed: {str(e)}")
    finally:
        try:
            if 'cap' in locals() and cap is not None:
                cap.release()
        except Exception:
            pass
        try:
            if 'video_path' in locals() and video_path and os.path.exists(video_path):
                os.remove(video_path)
        except Exception:
            pass


@router.post("/api/documents/extract-preview")
async def extract_document_preview(request: Dict[str, str]):
\
\
\
\
\
       
    try:
        document_id = request.get('document_id')
        document_type = request.get('document_type', 'pan')
        
        if not document_id:
            raise HTTPException(status_code=400, detail="document_id is required")
        
                                                       
        document_path = _resolve_document_path(document_id)
        
        print(f"[Preview] Processing document: {document_path}")
        
                                
        processor = get_document_processor()
        
                                                    
        cropped_doc_result = {'success': False, 'error': 'Document crop not attempted'}
        cropped_document_path = document_path                       
        
        if processor.face_service:
            try:
                print(f"[Preview] Detecting document boundaries...")
                cropped_doc_result = processor.face_service.detect_document_boundary(document_path)
                print(f"[Preview] Document crop result: {cropped_doc_result.get('success')}")
                
                if cropped_doc_result.get('success'):
                                                           
                    cropped_image_base64 = cropped_doc_result.get('image_base64', '')
                    print(f"[Preview] Cropped document extracted successfully")
                else:
                    print(f"[Preview] Document crop warning: {cropped_doc_result.get('error')}")
                                                                
            except Exception as crop_err:
                print(f"[Preview] Document crop exception: {str(crop_err)}")
                import traceback
                traceback.print_exc()
                cropped_doc_result = {'success': False, 'error': str(crop_err)}
        
                                                                                      
                                                                                    
        face_result = {'success': False, 'error': 'Face extraction not attempted'}
        if processor.face_service:
            try:
                face_result = processor.face_service.extract_face_as_base64(document_path)
                print(f"[Preview] Face extraction result: {face_result.get('success')}")
                if not face_result.get('success'):
                    print(f"[Preview] Face extraction error: {face_result.get('error')}")
            except Exception as face_err:
                print(f"[Preview] Face extraction exception: {str(face_err)}")
                import traceback
                traceback.print_exc()
                face_result = {'success': False, 'error': str(face_err)}
        
                                                                 
        name = None
        id_number = None
        data_result = {'success': False, 'error': 'Data extraction not attempted'}
        gemini_cross_check = None
        
        try:
            print(f"[Preview] Extracting text from document type: {document_type}")
            from ai.name_id_extractor import get_name_id_extractor
            from ai.paddle_ocr_service import get_paddle_service
            from ..services.document_parser import DocumentParser
            
            ocr_service = get_paddle_service()
            parser = DocumentParser()
            extractor = get_name_id_extractor()
            gemini_service = get_secondry_ocr_service()
            ocr_source = "paddle"
            
                                          
            print(f"[Preview] Using PaddleOCR for text extraction...")
            ocr_result = ocr_service.extract_text(document_path, preprocess=True)
            print(f"[Preview] OCR success: {ocr_result.get('success')}")
            
            if ocr_result.get('success') and ocr_result.get('raw_text'):
                raw_text = ocr_result['raw_text']
                structured_lines = ocr_result.get('structured_text') or []
                parse_text = "\n".join(structured_lines) if structured_lines else raw_text
                print(f"[Preview] Extracted text:\n{raw_text}")
                
                                                           
                parsed = parser.parse_document(parse_text, document_type)
                hybrid = extractor.extract(parse_text, document_type, structured_lines=structured_lines)
                print(f"[Preview] Parsed data: {parsed}")
                
                if parsed and isinstance(parsed, dict) and len(parsed) > 0:
                    parsed_name = parsed.get('name')
                    hybrid_name = (hybrid.get('fields', {}) or {}).get('name')
                    if document_type == 'pan' and hybrid_name and _looks_like_person_name(str(hybrid_name)):
                        name = hybrid_name
                    elif parsed_name and _looks_like_person_name(str(parsed_name)):
                        name = parsed_name
                    elif hybrid_name and _looks_like_person_name(str(hybrid_name)):
                        name = hybrid_name
                    else:
                        name = None
                    
                                                          
                    id_field_mapping = {
                        'aadhaar': 'aadhaar_number',
                        'pan': 'pan_number',
                        'driving_license': 'license_number',
                        'passport': 'passport_number',
                        'voter_id': 'voter_id'
                    }
                    id_field = id_field_mapping.get(document_type)
                    if id_field:
                        id_number = parsed.get(id_field)
                    if not id_number:
                        id_number = (hybrid.get('fields', {}) or {}).get('id_number')

                    print(f"[Preview] Final - Name: {name}, ID: {id_number}")
                    data_result = {'success': bool(name or id_number)}
                else:
                    id_number = (hybrid.get('fields', {}) or {}).get('id_number')
                    hybrid_name = (hybrid.get('fields', {}) or {}).get('name')
                    if hybrid_name and _looks_like_person_name(str(hybrid_name)):
                        name = hybrid_name
                    error_msg = 'Failed to parse extracted text'
                    print(f"[Preview] Parse error: {error_msg}")
                    data_result = {
                        'success': bool(name or id_number),
                        'error': None if (name or id_number) else error_msg
                    }

                                                                                          
                try:
                    if getattr(gemini_service, "available", False):
                        gemini_ocr = gemini_service.extract_text(document_path)
                        if gemini_ocr.get("success"):
                            gemini_raw = gemini_ocr.get("raw_text", "")
                            gemini_lines = gemini_ocr.get("structured_text", []) or []
                            gemini_text = "\n".join(gemini_lines) if gemini_lines else gemini_raw
                            gemini_hybrid = extractor.extract(gemini_text, document_type, structured_lines=gemini_lines)
                            gemini_fields = (gemini_hybrid.get("fields", {}) or {})

                            gem_name = gemini_fields.get("name")
                            gem_id = gemini_fields.get("id_number")
                            gemini_cross_check = {
                                "success": True,
                                "name": gem_name,
                                "id_number": gem_id,
                                "name_match": bool(name and gem_name and str(name).strip().lower() == str(gem_name).strip().lower()),
                                "id_match": bool(id_number and gem_id and str(id_number).upper() == str(gem_id).upper()),
                            }

                                                                                                                               
                            if (not name or not _looks_like_person_name(str(name))) and gem_name and _looks_like_person_name(str(gem_name)):
                                name = str(gem_name).strip()
                                                   
                            if not id_number and gem_id:
                                id_number = str(gem_id).strip()
                            if name or id_number:
                                data_result = {'success': True}
                        else:
                            gemini_cross_check = {
                                "success": False,
                                "error": gemini_ocr.get("error", "Gemini OCR cross-check failed")
                            }
                except Exception as gem_err:
                    gemini_cross_check = {
                        "success": False,
                        "error": f"Gemini OCR cross-check unavailable: {str(gem_err)}"
                    }
            else:
                error_msg = ocr_result.get('error', 'OCR failed')
                print(f"[Preview] OCR error: {error_msg}")
                data_result = {'success': False, 'error': error_msg}

                                                                        
                if getattr(gemini_service, "available", False):
                    gemini_ocr = gemini_service.extract_text(document_path)
                    if gemini_ocr.get("success"):
                        gemini_raw = gemini_ocr.get("raw_text", "")
                        gemini_lines = gemini_ocr.get("structured_text", []) or []
                        gemini_text = "\n".join(gemini_lines) if gemini_lines else gemini_raw
                        gemini_parsed = parser.parse_document(gemini_text, document_type)
                        gemini_hybrid = extractor.extract(gemini_text, document_type, structured_lines=gemini_lines)
                        gemini_fields = (gemini_hybrid.get("fields", {}) or {})

                        parsed_name = (gemini_parsed or {}).get("name") if isinstance(gemini_parsed, dict) else None
                        hybrid_name = gemini_fields.get("name")
                        if document_type == 'pan' and hybrid_name and _looks_like_person_name(str(hybrid_name)):
                            name = hybrid_name
                        elif parsed_name and _looks_like_person_name(str(parsed_name)):
                            name = parsed_name
                        elif hybrid_name and _looks_like_person_name(str(hybrid_name)):
                            name = hybrid_name

                        id_field_mapping = {
                            'aadhaar': 'aadhaar_number',
                            'pan': 'pan_number',
                            'driving_license': 'license_number',
                            'passport': 'passport_number',
                            'voter_id': 'voter_id'
                        }
                        id_field = id_field_mapping.get(document_type)
                        if id_field and isinstance(gemini_parsed, dict):
                            id_number = gemini_parsed.get(id_field)
                        if not id_number:
                            id_number = gemini_fields.get("id_number")

                        gemini_cross_check = {
                            "success": True,
                            "fallback_used": True,
                            "name": name,
                            "id_number": id_number,
                        }
                        if name or id_number:
                            ocr_source = "gemini_fallback"
                            data_result = {'success': True}
                        else:
                            data_result = {'success': False, 'error': 'No name/id extracted from Paddle or Gemini'}
                    else:
                        gemini_cross_check = {
                            "success": False,
                            "fallback_used": True,
                            "error": gemini_ocr.get("error", "Gemini OCR fallback failed")
                        }
                
        except Exception as data_err:
            print(f"[Preview] Data extraction exception: {str(data_err)}")
            import traceback
            traceback.print_exc()
            data_result = {'success': False, 'error': str(data_err)}
        
        return {
            'success': True,
            'document_id': document_id,
            'cropped_document': cropped_doc_result.get('image_base64') if cropped_doc_result.get('success') else None,
            'document_cropped': cropped_doc_result.get('success', False),
            'crop_width': cropped_doc_result.get('width'),
            'crop_height': cropped_doc_result.get('height'),
            'face_extracted': face_result.get('success', False),
            'face_image_base64': face_result.get('face_image_base64') if face_result.get('success') else None,
            'face_error': face_result.get('error') if not face_result.get('success') else None,
            'data_extracted': data_result.get('success', False),
            'name': name,
            'id_number': id_number,
            'data_error': data_result.get('error') if not data_result.get('success') else None,
            'ocr_source': ocr_source if (name or id_number) else "none",
            'gemini_cross_check': gemini_cross_check,
            'timestamp': datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Preview extraction exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Preview extraction failed: {str(e)}")


@router.post("/api/documents/manual-cross-check")
async def manual_cross_check_document_details(request: ManualCrossCheckRequest):
\
\
\
       
    try:
        document_path = _resolve_document_path(request.document_id)

        from ai.paddle_ocr_service import get_paddle_service
        from ai.name_id_extractor import get_name_id_extractor
        from ..services.document_parser import DocumentParser

        ocr_service = get_paddle_service()
        extractor = get_name_id_extractor()
        parser = DocumentParser()

        ocr_result = ocr_service.extract_text(document_path, preprocess=True)
        if not ocr_result.get("success"):
            return {
                "success": True,
                "document_id": request.document_id,
                "document_type": request.document_type,
                "ocr_available": False,
                "exists_in_ocr": False,
                "name_match": False,
                "id_match": False,
                "matched_fields": [],
                "message": ocr_result.get("error", "OCR unavailable for cross-check"),
                "timestamp": datetime.now().isoformat(),
            }

        raw_text = ocr_result.get("raw_text", "") or ""
        structured_lines = ocr_result.get("structured_text", []) or []
        parse_text = "\n".join(structured_lines) if structured_lines else raw_text

        parsed = parser.parse_document(parse_text, request.document_type)
        hybrid = extractor.extract(parse_text, request.document_type, structured_lines=structured_lines)
        fields = (hybrid.get("fields", {}) or {})

        id_field_mapping = {
            'aadhaar': 'aadhaar_number',
            'pan': 'pan_number',
            'driving_license': 'license_number',
            'passport': 'passport_number',
            'voter_id': 'voter_id'
        }
        id_field = id_field_mapping.get(str(request.document_type))

        ocr_candidate_name = parsed.get("name") or fields.get("name")
        ocr_candidate_id = (parsed.get(id_field) if id_field else None) or fields.get("id_number")

        entered_name = (request.entered_name or "").strip()
        entered_id = (request.entered_id or "").strip()

        ocr_lines = [str(line) for line in structured_lines if str(line).strip()]
        if ocr_candidate_name:
            ocr_lines.append(str(ocr_candidate_name))

        name_match = False
        id_match = False

        if entered_name:
            name_match = _name_exists_in_ocr(entered_name, ocr_lines)
            if not name_match and ocr_candidate_name:
                name_match = _normalize_name_for_match(entered_name) == _normalize_name_for_match(ocr_candidate_name)

        if entered_id:
            id_match = _id_exists_in_ocr(entered_id, raw_text)
            if not id_match and ocr_candidate_id:
                id_match = _normalize_id_for_match(entered_id) == _normalize_id_for_match(ocr_candidate_id)

        matched_fields = []
        if name_match:
            matched_fields.append("name")
        if id_match:
            matched_fields.append("id_number")

        exists_in_ocr = bool(name_match or id_match)
        if exists_in_ocr:
            message = "Manual details matched OCR text."
        else:
            message = "No strong OCR evidence found for entered details. Please verify document clarity."

        return {
            "success": True,
            "document_id": request.document_id,
            "document_type": request.document_type,
            "ocr_available": True,
            "ocr_method": ocr_result.get("method"),
            "ocr_best_variant": ocr_result.get("best_variant"),
            "exists_in_ocr": exists_in_ocr,
            "name_match": bool(name_match),
            "id_match": bool(id_match),
            "matched_fields": matched_fields,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual cross-check failed: {str(e)}")



@router.get("/api/health", response_model=HealthResponse)
async def health_check():
                                             
    try:
                       
        face_service = get_document_processor().face_service
        services = {
            'paddleocr': 'operational',
            'document_processor': 'operational',
            'face_model': 'operational' if face_service else 'unavailable',
            'fraud_detector': 'operational',
            'quality_assessor': 'operational',
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


@router.get("/api/debug/jobs")
async def debug_jobs():
                                                         
    return {
        "active_jobs": {
            job_id: {
                "status": job_info.get("status"),
                "progress": job_info.get("progress"),
                "message": job_info.get("message"),
                "created_at": job_info.get("created_at")
            }
            for job_id, job_info in processing_jobs.items()
        },
        "uploaded_files_count": len(uploaded_files),
        "results_count": len(processing_results),
        "uploaded_files": {
            doc_id: {
                "filename": info.get("filename"),
                "upload_timestamp": info.get("upload_timestamp")
            }
            for doc_id, info in uploaded_files.items()
        }
    }
