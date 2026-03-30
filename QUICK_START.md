# Quick Start - DocVerify

This guide starts the DocVerify API and demo frontend quickly.

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- pip and npm

## 2. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

## 3. Start Backend API

```bash
python run_backend.py
```

Backend will run at `http://localhost:8000`.

## 4. Verify Backend Health

- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/health`

## 5. Start Frontend (Optional)

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3005`.

## 6. Test Main ID Verification Flow

### Upload

```bash
curl -X POST "http://localhost:8000/api/documents/upload" -F "file=@path/to/id.jpg"
```

### Extract Preview (Face + Name + ID)

```bash
curl -X POST "http://localhost:8000/api/documents/extract-preview" \
  -H "Content-Type: application/json" \
  -d '{"document_id":"<DOCUMENT_ID>","document_type":"pan"}'
```

## 7. Face Match Flow

1. Upload ID image (`/api/documents/upload`).
2. Upload selfie image (`/api/documents/upload`).
3. Call `POST /api/face/match` with both IDs.

## 8. Optional Advanced Document Pipeline (API)

The backend still supports full document processing:

- `POST /api/documents/process`
- `GET /api/documents/status/{job_id}`
- `GET /api/documents/results/{document_id}`
- `POST /api/documents/{document_id}/authenticity`
- `POST /api/documents/{document_id}/validate-authenticity`

## Product Plan

DocVerify is being packaged as an API product for fintech startups, with focus on:

- onboarding/KYC integration
- face verification using our in-house model against ID face region
- production-grade API integration patterns
