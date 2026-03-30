# DocVerify

DocVerify is an API-first identity verification platform for fintech startups.

It verifies identity documents, extracts structured ID data, and matches the face on the ID against a selfie using our in-house face verification model.

## Product Direction

- Build a fintech-ready verification API that teams can integrate into onboarding and KYC flows.
- Provide reliable ID-to-selfie face verification through our own model pipeline.
- Keep the system modular so OCR, parsing, fraud signals, and face checks can evolve independently.

## Core Capabilities

- Document upload and processing for Indian IDs (`aadhaar`, `pan`, `driving_license`, `passport`, `voter_id`)
- OCR extraction with PaddleOCR
- Structured field parsing and rule validation
- Face extraction and face-match workflows
- AI fraud + authenticity analysis for tamper/AI-image risk signals
- AI quality assessment (blur, glare, clarity, resolution)
- Async job tracking (`upload -> process -> status -> results`)

## Current UI Scope

- Frontend is currently focused on ID verification only.
- Document analysis UI routes are temporarily disabled and redirect to ID verification.
- Backend document-analysis APIs remain available for integration/testing.

## API-First Architecture

```text
Client App (Fintech) -> DocVerify API (FastAPI) -> Verification Pipeline
                                            -> OCR + Parsing + Validation
                                            -> Face Verification (Proprietary Model)
                                            -> Fraud + Authenticity + Quality Signals
```

## Tech Stack

### Backend
- FastAPI
- Uvicorn
- PaddleOCR + PaddlePaddle
- FaceNet (facenet-pytorch + torch)
- OpenCV + Pillow + NumPy + SciPy
- Pydantic + python-dotenv

### Frontend (Demo/Operator UI)
- React 19
- React Router
- Axios
- Tailwind CSS
- face-api.js + react-webcam

## Repository Structure

```text
DOCUMENT-VERIFY/
|- ai/             AI services (OCR, FaceNet, fraud, quality, preprocessing, postprocessing, tests)
|- backend/        FastAPI app and processing services
|- frontend/       React app for demo and operator flows
|- docs/           Product + integration + API documentation
|- data/           Uploaded and processed file storage
|- requirements.txt
```

## Local Setup

```bash
pip install -r requirements.txt
python run_backend.py
```

Backend docs:
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/health`

Frontend:

```bash
cd frontend
npm install
npm start
```

## API Endpoints (Current)

- `POST /api/documents/upload`
- `POST /api/documents/process`
- `GET /api/documents/status/{job_id}`
- `GET /api/documents/results/{document_id}`
- `POST /api/face/match`
- `POST /api/documents/{document_id}/authenticity`
- `POST /api/documents/{document_id}/validate-authenticity`
- `POST /api/documents/extract-preview`
- `GET /api/health`

## Fintech Integration Goal

DocVerify is being prepared as a verification API product for fintech startups that need:

- Fast KYC onboarding checks
- ID document data extraction
- ID face vs selfie face matching via our own face model
- Explainable verification outcomes for compliance workflows

## Documentation Index

- `QUICK_START.md`
- `backend/README.md`
- `frontend/README.md`
- `docs/API_DOCUMENTATION.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/README_ML.md`

## License

MIT
