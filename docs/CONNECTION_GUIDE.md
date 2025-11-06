# Frontend-Backend Connection Guide

## Overview
The Document Verification system consists of:
- **Backend**: FastAPI server (port 8000) with document processing capabilities
- **Frontend**: React application (port 3000) with user interface

## Quick Start

### Option 1: Start Both Servers at Once
```bash
./start_all.sh
```

### Option 2: Start Servers Individually

**Start Backend:**
```bash
./start_backend.sh
```

**Start Frontend (in another terminal):**
```bash
./start_frontend.sh
```

## Access Points

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)

## Connection Features

### 1. Health Check
- The frontend automatically checks backend connectivity on startup
- Real-time status indicator shows connection state
- Upload functionality is disabled when backend is unavailable

### 2. Error Handling
- Network errors are handled gracefully with user-friendly messages
- API timeouts are set to 30 seconds for document processing
- Detailed error logging in browser console

### 3. API Endpoints Used by Frontend
- `POST /verify` - Single-step document verification
- `GET /api/health` - Backend health check
- `POST /api/documents/upload` - File upload
- `POST /api/documents/process` - Document processing
- `GET /api/documents/status/{job_id}` - Processing status
- `GET /api/documents/results/{document_id}` - Results retrieval

## Configuration

### Frontend Environment Variables
Create `.env` in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8000
```

### Backend Configuration
The backend is configured with:
- CORS enabled for all origins (development only)
- File upload directory: `data/uploads/`
- Processed files directory: `data/processed/`

## Troubleshooting

### Backend Won't Start
1. Ensure virtual environment is activated: `source venv/bin/activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Check Python path: `export PYTHONPATH="${PYTHONPATH}:$(pwd)"`

### Frontend Won't Start
1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm start`

### Connection Issues
1. Verify both servers are running
2. Check firewall settings for ports 3000 and 8000
3. Ensure no other applications are using these ports
4. Check browser console for detailed error messages

### File Upload Issues
1. Ensure uploaded files are images (JPEG, PNG, BMP, TIFF)
2. Check file size limits
3. Verify backend has write permissions to `data/uploads/`

## Development Notes

### API Service Layer
The frontend uses a dedicated API service (`src/services/api.js`) with:
- Axios interceptors for request/response logging
- Centralized error handling
- Timeout configuration
- Base URL configuration

### Component Structure
- `App.js` - Main application with backend health checking
- `FileUpload.js` - File upload component with validation
- `VerificationResult.js` - Results display component
- `Navbar.js` - Navigation component

### Backend Services
- `document_processor.py` - Main document processing logic
- `ocr_service.py` or `gemini_ocr_service.py` - OCR functionality
- `face_matching_service.py` - Face detection and matching

## Next Steps
1. Add authentication/authorization
2. Implement user sessions
3. Add document type detection
4. Enhance error reporting
5. Add progress tracking for long-running operations