# DocVerify Frontend

React frontend used as a demo/operator interface for DocVerify.

## Purpose

- demonstrate API flows for ID verification
- test upload/process/status/results journey
- test face matching using ID image and selfie

## Stack

- React 19
- React Router
- Axios
- Tailwind CSS
- face-api.js
- react-webcam

## Run

```bash
npm install
npm start
```

Default URL: `http://localhost:3005`

## Required Environment

```env
REACT_APP_API_URL=http://localhost:8000
PORT=3005
```

## API Endpoints Used

- `POST /api/documents/upload`
- `POST /api/documents/process`
- `GET /api/documents/status/{job_id}`
- `GET /api/documents/results/{document_id}`
- `POST /api/face/match`
- `GET /api/health`

## Product Context

This UI supports the API-first product plan for fintech startups.

The API is the main product, and this frontend helps validate flows for document checks and our in-house face verification model.
