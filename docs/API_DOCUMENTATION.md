# API Documentation

## Base URL

`http://localhost:8000`

## Product Scope

DocVerify is being built as an API product for fintech startups.

Core value:

- structured document verification
- ID-to-selfie face verification through our own model pipeline
- explainable verification outputs

## Endpoints

### 1. Upload Document

`POST /api/documents/upload`

Request: `multipart/form-data` with `file`

### 2. Process Document

`POST /api/documents/process`

```json
{
  "document_id": "uuid",
  "document_type": "pan",
  "use_gemini": false,
  "detect_face": true
}
```

### 3. Job Status

`GET /api/documents/status/{job_id}`

### 4. Document Results

`GET /api/documents/results/{document_id}`

### 5. Validate Parsed Data

`POST /api/documents/validate`

### 6. Supported Types

`GET /api/documents/types`

### 7. Generate Report

`GET /api/documents/report/{document_id}`

### 8. Delete Document

`DELETE /api/documents/{document_id}`

### 9. Face Match

`POST /api/face/match`

```json
{
  "document_id": "uuid_of_id_image",
  "selfie_id": "uuid_of_selfie_image"
}
```

### 10. Extract Preview

`POST /api/documents/extract-preview`

### 11. Authenticity Check

`POST /api/documents/{document_id}/authenticity`

### 12. Validate Authenticity

`POST /api/documents/{document_id}/validate-authenticity?document_type=pan`

### 13. Health

`GET /api/health`

## Supported Document Types

- `aadhaar`
- `pan`
- `driving_license`
- `passport`
- `voter_id`

## Typical Fintech Verification Flow

1. Upload ID document.
2. Process and wait for completion.
3. Upload selfie.
4. Call face match.
5. Store verification decision and confidence.

## Security Notes

- Add authentication (JWT/OAuth) before production.
- Add rate limiting and audit logs before public rollout.
- Replace in-memory stores with persistent database/cache for production use.
