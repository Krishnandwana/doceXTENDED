# DocVerify - Document Verification System

A comprehensive AI-powered document verification system that uses computer vision, OCR, and face recognition to authenticate Indian identity documents like PAN cards, Aadhaar cards, and more.

## 🚀 Features

- **Document OCR**: Extract text from identity documents using Google's Gemini AI or PaddleOCR
- **Face Detection**: Detect and extract faces from identity documents
- **Face Matching**: Compare faces between documents for verification
- **Multi-format Support**: Process various document formats (JPEG, PNG, PDF)
- **REST API**: FastAPI-based backend for easy integration
- **Web Interface**: Modern React frontend and Streamlit dashboard
- **Real-time Processing**: Asynchronous document processing with status tracking

## 🏗️ Architecture

```
DocVerify/
├── backend/                 # FastAPI backend
│   ├── api/                # API endpoints and models
│   ├── services/           # Core processing services
│   └── utils/              # Utility functions
├── frontend/               # React web application
├── data/                   # Data storage and uploads
├── tests/                  # Test files
└── streamlit_*.py         # Streamlit dashboard apps
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance async web framework
- **OpenCV** - Computer vision and image processing
- **face_recognition** - Face detection and matching
- **Google Gemini AI** - Advanced OCR capabilities
- **SQLAlchemy** - Database ORM
- **Pydantic** - Data validation

### Frontend
- **React.js** - Modern web interface
- **Streamlit** - Interactive dashboard
- **Plotly** - Data visualization

### AI/ML
- **Google Generative AI** - OCR and text extraction
- **OpenCV** - Image preprocessing
- **dlib** - Face landmark detection
- **NumPy/SciPy** - Numerical computing

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+ (for React frontend)
- Google Gemini API key (for OCR service)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Krishnandwana/DocVerify.git
cd DocVerify
```

### 2. Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the Application

#### Option A: Start All Services at Once
```bash
chmod +x start_all.sh
./start_all.sh
```

#### Option B: Start Services Individually

**Backend API:**
```bash
chmod +x start_backend.sh
./start_backend.sh
# Or manually: uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

**React Frontend:**
```bash
chmod +x start_frontend.sh
./start_frontend.sh
```

**Streamlit Dashboard:**
```bash
chmod +x run_streamlit.sh
./run_streamlit.sh
# Or manually: streamlit run streamlit_app.py
```

### 5. Access the Applications

- **API Documentation**: http://localhost:8000/docs
- **React Frontend**: http://localhost:3005
- **Streamlit Dashboard**: http://localhost:8501

## 🔧 API Usage

### Upload and Process Document

```bash
curl -X POST "http://localhost:8000/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_document.jpg"
```

### Get Processing Status

```bash
curl -X GET "http://localhost:8000/status/{job_id}" \
  -H "accept: application/json"
```

### Verify Two Documents

```bash
curl -X POST "http://localhost:8000/verify" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file1=@document1.jpg" \
  -F "file2=document2.jpg"
```

## 📊 Supported Document Types

- **PAN Card** - Permanent Account Number
- **Aadhaar Card** - Unique Identity Number
- **Driving License** - Driver's License
- **Passport** - Indian Passport
- **Voter ID** - Election Commission ID

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_ml_components.py

# Test OCR functionality
python ocr_test.py

# Debug API endpoints
python debug_api.py
```

## 🔍 Key Components

### Document Processor
- Image preprocessing and enhancement
- Text extraction using OCR
- Data validation and structuring

### Face Detection Service
- Face detection in documents
- Face encoding generation
- Face comparison and matching

### OCR Services
- **Gemini OCR**: Advanced AI-powered text extraction
- **Paddle OCR**: Fallback OCR service
- Multi-language support for Indian documents

## 🛡️ Security Features

- Input validation and sanitization
- File type and size restrictions
- Secure file handling
- API rate limiting (planned)
- Error handling and logging

## 📈 Performance

- **Async Processing**: Non-blocking document processing
- **Background Tasks**: Queue-based job processing  
- **Caching**: Processed results caching
- **Optimization**: Image compression and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

Detailed API documentation is available at `/docs` when running the server, or check:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [CONNECTION_GUIDE.md](CONNECTION_GUIDE.md)
- [STREAMLIT_GUIDE.md](STREAMLIT_GUIDE.md)

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **API Key Issues**: Verify Gemini API key in `.env` file
3. **Port Conflicts**: Change ports in configuration files
4. **Memory Issues**: Reduce image processing batch size

### Logs

Check application logs:
- API logs: `api.log`
- Console output for debugging

## 🔮 Roadmap

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and authorization
- [ ] Batch document processing
- [ ] Advanced fraud detection
- [ ] Mobile app integration
- [ ] Cloud deployment guides
- [ ] Performance monitoring

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Krish Anandwana** - Initial work - [Krishnandwana](https://github.com/Krishnandwana)

## 🙏 Acknowledgments

- Google Gemini AI for OCR capabilities
- OpenCV community for computer vision tools
- FastAPI team for the excellent web framework
- Face recognition library contributors

---

⭐ **Star this repository if you find it helpful!**

For questions or support, please [open an issue](https://github.com/Krishnandwana/DocVerify/issues).