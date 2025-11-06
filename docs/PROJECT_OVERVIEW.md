# DocVerify: Project Overview and Working

This document provides a comprehensive overview of the DocVerify system, explaining its architecture, features, and how it works.

## 1. What is DocVerify?

DocVerify is an AI-powered document verification system designed to automatically authenticate Indian identity documents. It uses Optical Character Recognition (OCR) to extract text and computer vision to detect and match faces, ensuring the authenticity of documents like PAN cards, Aadhaar cards, and more.

## 2. Core Features

- **Automated OCR**: Extracts text from document images using advanced OCR technology.
- **Face Verification**: Detects faces on documents and matches them against a live photo.
- **Multi-Document Support**: Can process various Indian identity documents (PAN, Aadhaar, etc.).
- **RESTful API**: A powerful FastAPI backend provides endpoints for all verification tasks.
- **Web Interface**: A user-friendly React application for easy interaction.
- **Asynchronous Processing**: Handles time-consuming verification tasks in the background without blocking the user.

## 3. How It Works: The Verification Workflow

The project has two main parts: a **frontend** (the user interface) and a **backend** (the processing engine).

### Step 1: Document Upload (Frontend)

- A user visits the web application and uploads an image of a document (e.g., a PAN card).
- The React frontend sends the image to the backend for processing.

### Step 2: Processing (Backend)

1.  **File Received**: The FastAPI backend receives the uploaded image.
2.  **OCR Extraction**: The `ocr_service` reads the image and extracts all the text from it.
3.  **Data Parsing**: The system then parses the extracted text to find specific information like the name, date of birth, and the document number.
4.  **Face Detection**: If it's a photo ID, the `face_detection_service` finds and extracts the face from the document.
5.  **Results Stored**: The extracted information and face data are stored, and a unique ID for the verification job is sent back to the frontend.

### Step 3: Displaying Results (Frontend)

- The frontend receives the job ID and periodically asks the backend for the status of the verification.
- Once the processing is complete, the frontend retrieves the results and displays them to the user, showing the extracted information and the verification status.

## 4. System Architecture

The system is built with a modern, decoupled architecture:

```
+-----------------+      +------------------+      +--------------------+
|   React         |      |   FastAPI        |      |   AI/ML Services   |
|   Frontend      |----->|   Backend API    |----->|   (OCR, Face       |
| (User Interface)|      | (Handles Logic)  |      |    Detection)      |
+-----------------+      +------------------+      +--------------------+
```

- **Frontend**: A React application that provides the user interface.
- **Backend**: A FastAPI server that exposes a REST API for the frontend to communicate with.
- **AI/ML Services**: Python services that perform the heavy lifting of OCR and face detection.

## 5. Technology Stack

- **Backend**: Python, FastAPI, Uvicorn
- **Frontend**: JavaScript, React.js, Axios
- **AI/ML**: Google Gemini AI / PaddleOCR, OpenCV, face_recognition
- **Database**: (Planned) SQLAlchemy, with current in-memory storage.

## 6. How to Run the Project

You can start the entire system with a single command.

### Using the Batch Scripts (Windows)

1.  **Start Everything**:
    ```batch
    start_all.bat
    ```
    This will open two new command prompt windows for the backend and frontend.

2.  **Start Individually**:
    -   Backend: `start_backend.bat`
    -   Frontend: `start_frontend.bat`

### Accessing the Application

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 7. Key API Endpoints

The backend provides several API endpoints. Here are a few important ones:

- `POST /api/documents/upload`: To upload a document.
- `POST /api/documents/process`: To start the OCR and verification process.
- `GET /api/documents/status/{job_id}`: To check the status of a verification job.
- `GET /api/documents/results/{document_id}`: To get the final verification results.

For a full list, see the [API Documentation](API_DOCUMENTATION.md) or visit `http://localhost:8000/docs` when the backend is running.

## 8. Project Structure

The project is organized into the following main directories:

```
DocVerify/
├── backend/         # The FastAPI application
│   ├── api/         # API endpoints and main app
│   └── services/    # Business logic (OCR, face detection)
├── frontend/        # The React application
│   └── src/
├── streamlit_app.py # An alternative dashboard application
└── ...              # Other configuration and script files
```
