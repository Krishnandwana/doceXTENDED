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

## 6. Test Main API Flow

### Upload

```bash
curl -X POST "http://localhost:8000/api/documents/upload" -F "file=@path/to/id.jpg"
```

### Process

```bash
curl -X POST "http://localhost:8000/api/documents/process" \
  -H "Content-Type: application/json" \
  -d '{"document_id":"<DOCUMENT_ID>","document_type":"pan","use_gemini":false,"detect_face":true}'
```

### Poll Status

```bash
curl "http://localhost:8000/api/documents/status/<JOB_ID>"
```

### Get Result

```bash
curl "http://localhost:8000/api/documents/results/<DOCUMENT_ID>"
```

## 7. Face Match Flow

1. Upload ID image.
2. Upload selfie image.
3. Call `POST /api/face/match` with both IDs.

## Product Plan

DocVerify is being packaged as an API product for fintech startups, with focus on:

- onboarding/KYC integration
- face verification using our in-house model against ID face region
- production-grade API integration patterns
