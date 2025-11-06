# DocVerify - Quick Start Guide

Get DocVerify up and running in minutes!

## Prerequisites

- Python 3.8 or higher
- Node.js 16+ (for frontend)
- Google Gemini API key

## Installation Steps

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Environment

The `.env` file already exists. Make sure it has your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Install Backend Dependencies

**Windows:**
```bash
install_dependencies.bat
```

**Linux/macOS:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Start the Backend

**Windows:**
```bash
start_backend.bat
```

**Linux/macOS:**
```bash
python run_backend.py
```

The backend will start at: http://localhost:8000

### 5. Test the API

Open your browser and go to:
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

### 6. Start the Frontend (when ready)

```bash
cd frontend
npm install
npm start
```

Frontend will open at: http://localhost:3005

## Testing the API

### Using the Swagger UI (Easiest)

1. Open http://localhost:8000/docs
2. Click on "POST /api/documents/upload"
3. Click "Try it out"
4. Upload a document image
5. Copy the returned `document_id`
6. Go to "POST /api/documents/process"
7. Enter the `document_id` and select document type
8. Click "Execute"
9. Check results using the `job_id`

### Using cURL

```bash
# Upload document
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@path/to/document.jpg"

# Process document (use document_id from above)
curl -X POST "http://localhost:8000/api/documents/process" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "your-document-id",
    "document_type": "pan",
    "use_gemini": true,
    "detect_face": true
  }'

# Check status (use job_id from above)
curl "http://localhost:8000/api/documents/status/{job_id}"

# Get results (use document_id)
curl "http://localhost:8000/api/documents/results/{document_id}"
```

### Using Python

```python
import requests

# Upload
with open('document.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/documents/upload',
        files={'file': f}
    )
doc_id = response.json()['document_id']

# Process
response = requests.post(
    'http://localhost:8000/api/documents/process',
    json={
        'document_id': doc_id,
        'document_type': 'aadhaar',
        'use_gemini': True,
        'detect_face': True
    }
)
job_id = response.json()['job_id']

# Check status
import time
while True:
    response = requests.get(f'http://localhost:8000/api/documents/status/{job_id}')
    status = response.json()
    print(f"Status: {status['status']}, Progress: {status['progress']}%")
    if status['status'] in ['completed', 'failed']:
        break
    time.sleep(1)

# Get results
response = requests.get(f'http://localhost:8000/api/documents/results/{doc_id}')
print(response.json())
```

## Supported Document Types

- `aadhaar` - Aadhaar Card
- `pan` - PAN Card
- `driving_license` - Driving License
- `passport` - Passport
- `voter_id` - Voter ID Card

## Common Issues

### 1. "GEMINI_API_KEY not found"

- Check that `.env` file exists in project root
- Verify API key is correctly set in `.env`
- Restart the backend server

### 2. "Module not found" errors

- Ensure virtual environment is activated
- Run: `pip install -r requirements.txt`

### 3. dlib installation fails

**Windows:**
- Install Visual Studio Build Tools
- Or use pre-built wheel: `pip install dlib-19.24.2-cp310-cp310-win_amd64.whl`

**Linux:**
```bash
sudo apt-get install cmake
pip install dlib
```

### 4. PaddleOCR downloads models slowly

- Models are downloaded on first use (~100-200MB)
- Be patient on first run
- Models are cached for subsequent runs

### 5. Face detection not working

- Ensure image has clear, visible face
- Check image quality
- Try adjusting tolerance parameter

## Project Structure

```
DOCUMENT-VERIFY/
├── backend/
│   ├── api/              # FastAPI application
│   │   ├── main.py       # Main app
│   │   ├── routes.py     # API endpoints
│   │   └── models.py     # Pydantic models
│   └── services/         # Core services
│       ├── gemini_ocr_service.py
│       ├── paddle_ocr_service.py
│       ├── document_parser.py
│       ├── face_detection_service.py
│       └── document_processor.py
├── frontend/             # React application (coming soon)
├── data/
│   ├── uploads/          # Uploaded documents
│   └── processed/        # Processed documents
├── docs/                 # Documentation
├── .env                  # Environment variables
├── requirements.txt      # Python dependencies
└── run_backend.py        # Backend runner script
```

## Next Steps

1. **Try different document types**
   - Test with various Indian ID documents
   - Compare Gemini vs PaddleOCR results

2. **Explore face verification**
   - Upload document with face
   - Upload live photo
   - Use `/api/face/verify` endpoint

3. **Check validation**
   - Use `/api/documents/validate` to test validation rules
   - See which fields are required for each document type

4. **Generate reports**
   - Use `/api/documents/report/{document_id}` for detailed reports
   - Export results for analysis

## Getting Help

- **API Documentation**: http://localhost:8000/docs
- **Backend README**: [backend/README.md](backend/README.md)
- **Project Documentation**: [docs/](docs/)
- **SRS Document**: [doc_srs.pdf](doc_srs.pdf)

## Features to Try

✅ **OCR with Gemini AI** - Highly accurate text extraction
✅ **Structured Data Extraction** - Automatic field detection
✅ **Document Validation** - Format and content validation
✅ **Face Detection** - Automatic face extraction
✅ **Face Matching** - Verify faces between documents
✅ **Liveness Detection** - Basic anti-spoofing
✅ **Quality Analysis** - Check image and face quality
✅ **Batch Processing** - Process multiple documents
✅ **Report Generation** - Detailed verification reports

## Performance Tips

1. **Use Gemini for best accuracy** (default)
2. **Enable face detection** for ID documents with photos
3. **Ensure good image quality** - clear, well-lit, high resolution
4. **Process in batches** for multiple documents
5. **Cache results** to avoid reprocessing

Enjoy using DocVerify! 🚀
