# DocVerify Frontend

React frontend used as a demo/operator interface for DocVerify.

## Purpose

- demonstrate API flows for ID verification
- test ID upload and preview extraction journey
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
- `POST /api/documents/extract-preview`
- `POST /api/face/match`
- `GET /api/health`

## Product Context

This UI supports the API-first product plan for fintech startups.

The API is the main product, and this frontend currently focuses on ID verification and face matching flows.
Document analysis pages are temporarily disabled in the UI.
