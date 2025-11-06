# Backend Connection Setup Guide

## Quick Start

### 1. Start Backend Server
```bash
# Windows
start_backend.bat

# The backend will run on: http://localhost:8000
```

### 2. Start Frontend
```bash
# Windows
start_frontend.bat

# The frontend will run on: http://localhost:3003
```

### 3. Test Connection
```bash
# Windows
test_connection.bat
```

---

## Configuration Files

### Backend (.env in root directory)
```env
GEMINI_API_KEY="your_gemini_api_key_here"
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (frontend/.env)
```env
PORT=3003
BROWSER=none
REACT_APP_API_URL=http://localhost:8000
```

---

## Connection Architecture

```
Frontend (React)           Backend (FastAPI)
http://localhost:3003  →   http://localhost:8000
     │                           │
     │   API Requests            │
     └──────────────────────────→│
     │                           │
     │   JSON Responses          │
     │←──────────────────────────┘
```

---

## API Endpoints

### Health Check
- **URL:** `http://localhost:8000/api/health`
- **Method:** GET
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-11-06T...",
    "services": {
      "ocr": "operational",
      "document_processor": "operational",
      "face_matching": "operational"
    }
  }
  ```

### Document Upload
- **URL:** `http://localhost:8000/api/documents/upload`
- **Method:** POST
- **Content-Type:** multipart/form-data

### Document Verification
- **URL:** `http://localhost:8000/verify`
- **Method:** POST
- **Content-Type:** multipart/form-data

---

## Troubleshooting

### Backend Not Responding

#### Symptom
```
Cannot connect to backend server at http://localhost:8000
```

#### Solutions

1. **Check if backend is running**
   ```bash
   netstat -ano | findstr :8000
   ```

2. **Start backend**
   ```bash
   start_backend.bat
   ```

3. **Check backend logs**
   - Look for errors in the console where backend is running
   - Check if port 8000 is already in use

4. **Kill existing process on port 8000**
   ```bash
   # Find PID
   netstat -ano | findstr :8000
   # Kill process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

### CORS Errors

#### Symptom
```
Access to XMLHttpRequest blocked by CORS policy
```

#### Solution
Backend already configured with CORS for:
- `http://localhost:3003`
- `http://localhost:3000`
- `http://127.0.0.1:3003`
- `http://127.0.0.1:3000`

If using different port, update `backend/api/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:YOUR_PORT",
        # ... other origins
    ],
    # ...
)
```

### Connection Timeout

#### Symptom
```
Request timeout. The server took too long to respond.
```

#### Solutions

1. **Increase timeout** (already set to 120s)
2. **Check system resources** - ML operations require significant CPU
3. **Reduce image size** - Large images take longer to process
4. **Check Gemini API key** - Ensure it's valid and has quota

### Frontend Shows "Backend Disconnected"

#### Solutions

1. **Verify REACT_APP_API_URL in frontend/.env**
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

2. **Restart frontend after .env changes**
   ```bash
   # Stop frontend (Ctrl+C)
   # Restart
   start_frontend.bat
   ```

3. **Clear browser cache**
   - Hard refresh: Ctrl + Shift + R
   - Or clear cache in browser settings

4. **Check browser console**
   - F12 → Console tab
   - Look for connection errors

---

## Testing Connection

### Using cURL
```bash
# Test root endpoint
curl http://localhost:8000/

# Test health endpoint
curl http://localhost:8000/api/health

# Test with verbose output
curl -v http://localhost:8000/api/health
```

### Using Browser
1. Open: `http://localhost:8000/` - Should show API info
2. Open: `http://localhost:8000/api/health` - Should show health status
3. Open: `http://localhost:8000/docs` - FastAPI Swagger UI

### Using Connection Test Script
```bash
test_connection.bat
```

---

## Network Configuration

### Port Usage
- **Backend:** 8000 (FastAPI)
- **Frontend:** 3003 (React)
- **Streamlit:** 8501 (if using Streamlit)

### Firewall Rules
If having connection issues, ensure firewall allows:
- Inbound connections on port 8000
- Outbound connections to localhost

#### Windows Firewall
```bash
# Allow inbound (run as Administrator)
netsh advfirewall firewall add rule name="FastAPI Backend" dir=in action=allow protocol=TCP localport=8000
```

---

## Performance Optimization

### Backend Optimization
1. **Thread Pool Size** - Adjust in `backend/api/main.py`:
   ```python
   executor = ThreadPoolExecutor(max_workers=4)
   ```

2. **Timeout Settings** - Adjust based on your hardware:
   ```python
   timeout = 120  # seconds
   ```

3. **Image Preprocessing** - Resize large images before upload

### Frontend Optimization
1. **Request Timeout** - Already set to 120s in `frontend/src/services/api.js`
2. **Retry Logic** - Automatic retry on 500 errors
3. **Connection Status** - Real-time monitoring with auto-refresh

---

## Development vs Production

### Development (Current Setup)
- CORS: Allow all origins (`"*"`)
- No authentication required
- In-memory storage
- Detailed error messages

### Production Recommendations
1. **Restrict CORS**
   ```python
   allow_origins=["https://your-domain.com"]
   ```

2. **Add authentication** (JWT/OAuth2)
3. **Use database** instead of in-memory storage
4. **Enable HTTPS**
5. **Add rate limiting**
6. **Hide detailed error messages**
7. **Set up monitoring and logging**

---

## API Response Times

Typical response times (on modern hardware):

| Operation | Expected Time |
|-----------|---------------|
| Health Check | < 100ms |
| Document Upload | 100-500ms |
| OCR Processing | 2-5 seconds |
| Face Detection | 1-3 seconds |
| Full Verification | 5-10 seconds |

If times are significantly higher, check:
- CPU usage
- Available memory
- Gemini API response time
- Image size and quality

---

## Contact & Support

For issues:
1. Check this guide first
2. Review logs in backend console
3. Run `test_connection.bat`
4. Check browser console (F12)
5. Refer to API documentation: `http://localhost:8000/docs`

---

**Last Updated:** November 6, 2025
