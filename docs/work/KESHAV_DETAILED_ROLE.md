# Keshav - Detailed Contribution and Technical Scope

## Role Summary

Keshav is the backend engineer and owner of API orchestration, contracts, and reliability.

Primary focus:
- FastAPI route layer and request/response contracts
- Background processing orchestration
- Integration of AI services into stable backend workflows
- Validation, error handling, and operational consistency

## What Keshav Has Done

- Built and maintained the backend API surface for upload/process/status/results flows.
- Implemented document processing job orchestration with in-memory job tracking.
- Integrated parser, OCR, face, fraud, and quality results into a unified pipeline response.
- Implemented preview extraction endpoint used by the ID verification UI.
- Maintained validation endpoints, supported document types endpoint, report generation endpoint, and health endpoint.
- Managed face matching endpoint integration with backend processor.
- Added route-level safety checks and structured failures for missing inputs/files/jobs.
- Maintained backend README and endpoint-level behavior documentation alignment.

## How Keshav Implemented It

- Used FastAPI routers and Pydantic models to keep API contracts explicit.
- Separated API layer from service layer for cleaner responsibilities.
- Used background tasks for async processing and explicit status polling endpoints.
- Kept file uploads mapped to generated document IDs for downstream traceability.
- Normalized response payloads so frontend consumers can render with predictable keys.
- Added operational fallback/warning paths when services are unavailable.

## Development Area and File Responsibilities

### API Bootstrapping and App Wiring

File: `backend/api/main.py`  
Purpose:
- FastAPI app bootstrap and route registration.

File: `backend/api/__init__.py`  
Purpose:
- API package initialization.

### API Contracts

File: `backend/api/models.py`  
Purpose:
- Pydantic request/response models.
- Shared enums for document types and processing states.
- Defines the typed API contract between backend and frontend.

### API Routes and Orchestration

File: `backend/api/routes.py`  
Purpose:
- Upload endpoint (`/api/documents/upload`)
- Process endpoint (`/api/documents/process`)
- Status endpoint (`/api/documents/status/{job_id}`)
- Results endpoint (`/api/documents/results/{document_id}`)
- Validate endpoint (`/api/documents/validate`)
- Supported types endpoint (`/api/documents/types`)
- Report endpoint (`/api/documents/report/{document_id}`)
- Delete endpoint (`/api/documents/{document_id}`)
- Authenticity endpoint (`/api/documents/{document_id}/authenticity`)
- Validate-authenticity endpoint (`/api/documents/{document_id}/validate-authenticity`)
- Face match endpoint (`/api/face/match`)
- Preview extraction endpoint (`/api/documents/extract-preview`)
- Health endpoint (`/api/health`)
- Debug jobs endpoint (`/api/debug/jobs`)

This file is the main backend control plane.

### Service Layer

File: `backend/services/document_processor.py`  
Purpose:
- Core backend processing orchestration across OCR, parsing, extraction, quality, fraud, and face checks.
- Produces the combined structured result returned to API consumers.

File: `backend/services/document_parser.py`  
Purpose:
- Rule-based parsing and validation by document type.
- Field-level consistency checks and type-specific extraction handling.

File: `backend/services/face_detection_service.py`  
Purpose:
- Backend-side face utilities (legacy/local service path retained for compatibility).

File: `backend/services/offline_ai_detector.py`  
Purpose:
- Legacy offline authenticity heuristics module (kept for compatibility/reference).

File: `backend/services/paddle_ocr_service.py`  
Purpose:
- Backend-level OCR service path (legacy/compatibility wrapper).

File: `backend/services/ai/paddle_ocr_service.py`  
Purpose:
- Additional OCR wrapper namespace under backend services.

File: `backend/services/__init__.py`  
Purpose:
- Service package initialization.

### Backend Documentation

File: `backend/README.md`  
Purpose:
- Backend setup/run instructions.
- Endpoint list and processing pipeline description.

## Integration Responsibilities Across Teams

- Consumes AI modules owned by Krish and converts them into stable API responses.
- Exposes payloads used directly by frontend pages owned by Khsuhi.
- Ensures response keys and status semantics remain predictable across releases.

## Backend Reliability Responsibilities

- Defensive checks for missing uploads/jobs/documents.
- Controlled exception-to-HTTP error conversion.
- Processing status lifecycle tracking (`pending`, `processing`, `completed`, `failed`).
- Centralized health check with service availability flags.

## Business Value Delivered by Keshav

- Turned model and parsing capabilities into production-style API workflows.
- Enabled asynchronous document processing suitable for heavier inference steps.
- Reduced frontend coupling risk by maintaining clear backend contracts.
- Provided a foundation for future persistence/auth/rate-limit improvements.
