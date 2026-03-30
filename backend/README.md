# DocVerify Backend

FastAPI backend for DocVerify's verification pipeline.

## Mission

Provide a fintech-ready verification API for:

- document OCR and field extraction
- rules validation by document type
- ID-face to selfie-face verification using our own face model pipeline
- authenticity + fraud risk signals
- quality scoring signals

## Stack

- FastAPI + Uvicorn
- PaddleOCR + PaddlePaddle
- FaceNet (facenet-pytorch + torch)
- OpenCV + Pillow + NumPy + SciPy
- Pydantic + python-dotenv

## Run

```bash
pip install -r requirements.txt
python run_backend.py
```

## API Docs

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/api/health`

## Primary Endpoints

- `POST /api/documents/upload`
- `POST /api/documents/process`
- `GET /api/documents/status/{job_id}`
- `GET /api/documents/results/{document_id}`
- `POST /api/face/match`
- `POST /api/documents/extract-preview`
- `POST /api/documents/{document_id}/authenticity`
- `POST /api/documents/{document_id}/validate-authenticity`

## Processing Pipeline

1. Upload file
2. Create background processing job
3. OCR extraction via PaddleOCR
4. Parse + validate fields by document type
5. Face verification using FaceNet embeddings + cosine similarity
6. Fraud/authenticity + quality checks
6. Return structured verification output

## Frontend Scope Note

- Current frontend UI is ID-verification-only.
- Document analysis endpoints in this backend are still active for API consumers.

## Product Positioning

This backend is the core of our planned fintech API offering.

We provide our own model-driven face verification logic to compare the face in ID documents with user selfies for identity confirmation.
