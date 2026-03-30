# Krish - Detailed Contribution and Technical Scope

## Role Summary

Krish is the AI lead and cross-functional integration support engineer.

Primary focus:
- `ai/` architecture and model behavior
- OCR, face verification, fraud signals, quality signals
- Threshold calibration and explainability logic

Secondary focus:
- Helping backend consume AI outputs safely
- Helping frontend render AI outputs correctly

## What Krish Has Done

- Designed a modular AI package where each capability is isolated by concern.
- Implemented OCR service orchestration with preprocessing and fallback behavior.
- Implemented/maintained face detection and embedding flow for ID/selfie verification.
- Implemented fraud and authenticity scoring with risk-level outputs.
- Implemented quality scoring for blur/glare/clarity/reliability checks.
- Implemented document classification and hybrid rule extraction for name/ID.
- Added preprocessing and postprocessing utilities to improve final consistency.
- Added AI-focused tests for extractor/classifier/postprocessing components.
- Supported backend integration by standardizing AI service interfaces.
- Supported frontend integration by aligning output fields and confidence semantics.

## How Krish Implemented It

- Used singleton-style service getters (`get_*_service`) so heavy model clients are reused.
- Kept each AI function in its own module to reduce coupling and simplify debugging.
- Combined heuristics + confidence calibration rather than relying on a single score source.
- Added layered output:
- raw signals
- normalized confidence
- explainable reason strings
- Added fallback paths for operational resilience when model loading or inputs fail.

## Development Area and File Responsibilities

### Core AI Service Entry

File: `ai/__init__.py`  
Purpose:
- Centralized exports for AI services.
- Single import point used by backend.

### OCR

File: `ai/paddle_ocr_service.py`  
Purpose:
- OCR engine wrapper.
- Text extraction output formatting for downstream parser/extractor use.
- Operational handling around OCR initialization and runtime usage.

### Face Pipeline

File: `ai/face_detection_service.py`  
Purpose:
- Face detection, face alignment utilities, embedding pipeline support.
- Face comparison helpers and document-face extraction logic.
- Additional utilities used by preview and verification flows.

File: `ai/face_liveness_service.py`  
Purpose:
- Liveness-oriented checks and anti-spoof support signals.

### Fraud and Quality Intelligence

File: `ai/fraud_detection_service.py`  
Purpose:
- Tampering/AI-generation risk scoring.
- Produces:
- `is_suspicious`
- `suspicious_score`
- `risk_level`
- `review_recommended`
- Returns signal-level breakdown for explainability.

File: `ai/quality_assessment_service.py`  
Purpose:
- Quality scoring (blur/glare/clarity metrics).
- Produces quality score + metrics used for review decisions.

### Document Understanding

File: `ai/document_classifier.py`  
Purpose:
- Text-based document-type classification.

File: `ai/name_id_extractor.py`  
Purpose:
- Hybrid extraction for person name, ID number, and supporting fields.
- Improved extraction selection behavior across OCR noise cases.

### Configuration and Monitoring

File: `ai/model_registry.py`  
Purpose:
- Central place for model names/versions/feature flags/threshold references.

File: `ai/monitoring.py`  
Purpose:
- Inference timing helpers and monitoring hooks.

### Preprocessing

File: `ai/preprocessing/image_cleaner.py`  
Purpose:
- Denoise, deskew, contrast enhancement, shadow reduction, perspective correction.
- Prepares document image before OCR or downstream extraction.

### Postprocessing

File: `ai/postprocessing/field_normalizer.py`  
Purpose:
- Normalize extracted fields (name/date/ID formats).

File: `ai/postprocessing/result_fusion.py`  
Purpose:
- Fuse multiple confidence components into one decision.

File: `ai/postprocessing/confidence_calibrator.py`  
Purpose:
- Calibrate confidence values for better decision behavior.

File: `ai/postprocessing/explainability.py`  
Purpose:
- Build human-readable explainability payloads from fused results.

### AI Test Coverage

File: `ai/tests/test_name_id_extractor.py`  
Purpose:
- Regression checks for extraction behavior.

File: `ai/tests/test_document_classifier.py`  
Purpose:
- Classification checks and expected behavior consistency.

File: `ai/tests/test_postprocessing.py`  
Purpose:
- Validation for normalization/fusion/explainability utility behavior.

File: `ai/tests/fixtures/expected_outputs.json`  
Purpose:
- Fixed expected outputs used by tests.

File: `ai/tests/fixtures/README.md`  
Purpose:
- Fixture usage notes.

## Krish Support Contributions Outside `ai/`

File: `backend/services/document_processor.py`  
AI-focused areas:
- Integration of OCR/classifier/extractor/fraud/quality services.
- Fused analysis/explainability assembly.

File: `backend/api/routes.py`  
AI-focused areas:
- Authenticity and validation route response mapping with AI risk fields.
- Preview extraction path using OCR + extraction heuristics.

File: `frontend/src/pages/IDVerificationWorking.js`  
AI-focused areas:
- Consumption of extracted name/ID and face-preview outputs.

File: `frontend/src/pages/DocumentVerificationWorking.js`  
AI-focused areas:
- Authenticity visualization and risk/review rendering logic (currently not active in main UI).

## Business Value Delivered by Krish

- Converted AI functionality into reusable backend-consumable services.
- Improved reliability through fallback and defensive output design.
- Made outputs explainable enough for product and compliance review workflows.
- Reduced integration risk across backend and frontend by standardizing AI contracts.
