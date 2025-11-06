# Document Verification API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently no authentication required (add JWT/OAuth2 for production)

## Endpoints

### 1. Upload Document
**POST** `/api/documents/upload`

Upload a document image for processing.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with file field

**Example:**
```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -F "file=@/path/to/document.jpg"
```

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "aadhaar_card.jpg",
  "upload_timestamp": "2024-01-20T10:30:00",
  "file_path": "/data/uploads/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

### 2. Process Document
**POST** `/api/documents/process`

Process an uploaded document for OCR and validation.

**Request:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "document_type": "aadhaar"
}
```

**Response:**
```json
{
  "job_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "processing",
  "message": "Document processing started"
}
```

### 3. Check Processing Status
**GET** `/api/documents/status/{job_id}`

Get the status of a processing job.

**Response:**
```json
{
  "job_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "processing",
  "progress": 75,
  "message": "Running OCR extraction",
  "started_at": "2024-01-20T10:31:00",
  "completed_at": null
}
```

### 4. Get Document Results
**GET** `/api/documents/results/{document_id}`

Get the processing results for a document.

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "timestamp": "2024-01-20T10:31:30",
    "document_type": "aadhaar",
    "overall_status": "completed",
    "ocr_result": {
      "raw_text": "Government of India...",
      "structured_text": ["line1", "line2"],
      "confidence_scores": [0.95, 0.92],
      "bounding_boxes": [[[100,100], [200,100], [200,150], [100,150]]]
    },
    "parsed_data": {
      "name": "John Doe",
      "aadhaar_number": "1234 5678 9012",
      "dob": "15/08/1990",
      "gender": "Male",
      "address": "123 Main Street, City"
    },
    "errors": [],
    "warnings": []
  }
}
```

### 5. Batch Process Documents
**POST** `/api/documents/batch`

Process multiple documents in batch.

**Request:**
```json
{
  "documents": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "document_type": "aadhaar"
    },
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440001",
      "document_type": "pan"
    }
  ]
}
```

**Response:**
```json
{
  "batch_id": "770e8400-e29b-41d4-a716-446655440002",
  "total_documents": 2,
  "job_ids": ["job1", "job2"],
  "status": "processing"
}
```

### 6. Validate Document Data
**POST** `/api/documents/validate`

Validate document data against type-specific rules.

**Request:**
```json
{
  "document_data": {
    "name": "John Doe",
    "pan_number": "ABCDE1234F",
    "father_name": "Robert Doe"
  },
  "document_type": "pan"
}
```

**Response:**
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [],
  "validation_details": {
    "pan_number": {
      "valid": true,
      "format_correct": true
    }
  }
}
```

### 7. Extract OCR Only
**POST** `/api/ocr/extract`

Extract text from document using OCR without full processing.

**Request:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "preprocess": true
}
```

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "ocr_result": {
    "raw_text": "Extracted text content...",
    "structured_text": ["line1", "line2"],
    "confidence_scores": [0.95, 0.92],
    "bounding_boxes": [[[100,100], [200,100], [200,150], [100,150]]]
  }
}
```

### 8. Generate Document Report
**GET** `/api/documents/report/{document_id}`

Generate a detailed processing report.

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "report": "Document Processing Report\n========================\n...",
  "generated_at": "2024-01-20T10:35:00"
}
```

### 9. Get Supported Document Types
**GET** `/api/documents/types`

Get list of supported document types and their fields.

**Response:**
```json
{
  "supported_types": [
    {
      "type": "aadhaar",
      "description": "Aadhaar Card - Indian national ID",
      "required_fields": ["name", "aadhaar_number", "dob"],
      "optional_fields": ["gender", "address", "father_name"]
    },
    {
      "type": "pan",
      "description": "PAN Card - Permanent Account Number",
      "required_fields": ["name", "pan_number", "father_name"],
      "optional_fields": ["dob"]
    },
    {
      "type": "driving_license",
      "description": "Indian Driving License",
      "required_fields": ["name", "license_number", "dob"],
      "optional_fields": ["validity", "address", "blood_group"]
    }
  ]
}
```

### 10. Delete Document
**DELETE** `/api/documents/{document_id}`

Delete a document and its associated data.

**Response:**
```json
{
  "message": "Document deleted successfully",
  "document_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 11. Health Check
**GET** `/api/health`

Check API and service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:36:00",
  "services": {
    "ocr": "operational",
    "document_processor": "operational"
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Running the API

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the server:
```bash
python run_api.py
```

The API will be available at `http://localhost:8000`

Interactive API documentation (Swagger UI) available at: `http://localhost:8000/docs`

Alternative API documentation (ReDoc) available at: `http://localhost:8000/redoc`