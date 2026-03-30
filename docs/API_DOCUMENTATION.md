# API Documentation

## Base URL

`http://localhost:8000`

## API Purpose

DocVerify provides a verification API for fintech onboarding workflows. The API supports:
- document intake
- extraction and validation
- face matching
- authenticity and quality checks
- async processing orchestration

Current frontend scope is ID verification first. Backend advanced document-analysis endpoints remain available.

## Authentication (Current State)

- No auth is enforced in current local/dev mode.
- Production recommendation: JWT or OAuth2 with tenant-level scopes.

## Core Data Objects

### Document ID

- Generated at upload stage.
- Used in preview, process, and result APIs.

### Job ID

- Generated when `/api/documents/process` is called.
- Used to poll processing status.

### Status Values

- `pending`
- `processing`
- `completed`
- `failed`

## Endpoints

### 1. Upload Document

`POST /api/documents/upload`

Request:
- `multipart/form-data`
- field: `file`

Response (example):

```json
{
  "success": true,
  "document_id": "f39e...",
  "filename": "pan.jpg",
  "upload_timestamp": "2026-03-31T14:00:00",
  "file_path": "data/uploads/f39e....jpg",
  "message": "File uploaded successfully"
}
```

### 2. Extract Preview (ID Flow)

`POST /api/documents/extract-preview`

Request example:

```json
{
  "document_id": "f39e...",
  "document_type": "pan"
}
```

Response fields include:
- document crop indicators
- face extraction result
- `name`
- `id_number`
- extraction status/errors

### 3. Start Async Document Processing

`POST /api/documents/process`

Request example:

```json
{
  "document_id": "f39e...",
  "document_type": "pan",
  "use_gemini": false,
  "detect_face": true
}
```

Response example:

```json
{
  "success": true,
  "job_id": "a91c...",
  "status": "pending",
  "message": "Processing started",
  "started_at": "2026-03-31T14:01:00"
}
```

### 4. Get Job Status

`GET /api/documents/status/{job_id}`

Response includes:
- `status`
- `progress`
- `message`
- start/completion timestamps

### 5. Get Processed Results

`GET /api/documents/results/{document_id}`

Response includes:
- parsed data
- OCR result
- validation output
- analysis output
- errors and warnings

### 6. Validate Parsed Data

`POST /api/documents/validate`

Request:
- `document_data`
- `document_type`

Returns type-aware validation result.

### 7. Supported Document Types

`GET /api/documents/types`

Returns supported types and required fields.

### 8. Generate Verification Report

`GET /api/documents/report/{document_id}`

Returns human-readable report text.

### 9. Delete Document

`DELETE /api/documents/{document_id}`

Deletes uploaded file and in-memory references.

### 10. Face Match

`POST /api/face/match`

Request example:

```json
{
  "document_id": "uuid_of_id_image",
  "selfie_id": "uuid_of_selfie_image"
}
```

Response includes:
- `faces_match`
- `similarity_percentage`
- `confidence`
- `face_distance`
- optional liveness payload

### 11. Authenticity Check

`POST /api/documents/{document_id}/authenticity`

Response includes:
- `is_authentic`
- `is_ai_generated`
- `confidence_score`
- `risk_level` (`low`, `medium`, `high`)
- `review_recommended`
- `detection_method`
- `signals`
- `explanation`

### 12. Validate Authenticity + Quality

`POST /api/documents/{document_id}/validate-authenticity?document_type=pan`

Response includes:
- `is_clear`
- `appears_genuine`
- `tampering_detected`
- `format_valid`
- `confidence_score`
- `validation` object
- quality metrics + fraud signals

### 13. Health Check

`GET /api/health`

Returns service status and component readiness.

### 14. Debug Jobs (Dev)

`GET /api/debug/jobs`

Returns active jobs/uploads/results summary for troubleshooting.

## Supported Document Types

- `aadhaar`
- `pan`
- `driving_license`
- `passport`
- `voter_id`

## Typical Integration Flows

### ID Verification Flow (Current UI Flow)

1. Upload ID image.
2. Extract preview (`name`, `id_number`, face crop).
3. Upload selfie image.
4. Run face match.
5. Persist match decision and confidence.

### Full Document Analysis Flow (API)

1. Upload document.
2. Start processing.
3. Poll status.
4. Fetch result and store extracted fields + quality/fraud signals.

## Error Model

Common error conditions:
- invalid file type
- missing document ID or job ID
- processing timeout
- model/service unavailable
- parse/extraction failure

Recommendations:
- retry idempotent operations where safe
- surface user-readable fallback messages
- log request IDs and payload snapshots for support

## Performance Notes

- Async processing used for heavy jobs.
- OCR/model initialization may increase first-request latency.
- Polling interval should be tuned for user experience and backend load.

## Security and Production Recommendations

- Add JWT/OAuth and tenant identity.
- Encrypt storage paths and sensitive logs.
- Add rate limiting and abuse detection.
- Keep audit trail for verification decisions.
- Replace in-memory stores with persistent database/cache.

## PPT/Report Talking Points

- API design supports both synchronous identity checks and async heavy analysis.
- Endpoint contracts expose explainable fraud/quality outputs, not just pass/fail.
- Integration can start quickly with upload + preview + face match flow.
- Platform has clear path to production hardening.
