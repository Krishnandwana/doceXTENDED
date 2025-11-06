# Document Processing System - ML Components

This document processing system uses advanced OCR and face detection to extract and validate information from Indian identity documents.

## Features

### OCR (Optical Character Recognition)
- **PaddleOCR** for robust text extraction
- Image preprocessing for better accuracy
- Multi-language support (English/Hindi)
- Confidence scoring for extracted text

### Face Detection
- Multiple detection backends (OpenCV, dlib, face_recognition)
- Face quality assessment (blur, brightness, size)
- Position verification for document standards
- Facial landmark detection (with dlib)

### Document Support
- **Aadhaar Card**: Name, number, DOB, gender, father's name
- **PAN Card**: Name, number, father's name, DOB
- **Driving License**: Name, number, DOB, validity, address

## Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# For dlib (optional, improves face detection)
# On Ubuntu/Debian:
sudo apt-get install cmake
pip install dlib

# Download dlib face landmarks (optional)
wget http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
bunzip2 shape_predictor_68_face_landmarks.dat.bz2
```

## Usage

### Basic Usage

```python
from backend.services.document_processor import DocumentProcessor

processor = DocumentProcessor()
result = processor.process_document('document.jpg', 'aadhaar')

print(f"Status: {result['overall_status']}")
print(f"Extracted data: {result['parsed_data']}")
```

### Command Line Demo

```bash
python demo.py sample_aadhaar.jpg aadhaar
python demo.py sample_pan.jpg pan
python demo.py sample_dl.jpg driving_license
```

### Testing

```bash
python tests/test_ml_components.py
```

## Component Details

### OCRService
- `extract_text(image_path)`: Basic OCR extraction
- `extract_with_preprocessing(image_path)`: OCR with image enhancement
- `preprocess_image(image_path)`: Image cleaning and enhancement

### DocumentParser
- `parse_document(text, doc_type)`: Extract structured data from text
- `validate_document_data(data, doc_type)`: Validate extracted information

### FaceDetectionService
- `detect_faces_opencv(image_path)`: Basic face detection
- `detect_faces_dlib(image_path)`: Advanced detection with landmarks
- `analyze_face_quality(image_path, coordinates)`: Quality assessment

### DocumentProcessor
- `process_document(image_path, doc_type)`: Complete processing pipeline
- `batch_process_documents(doc_list)`: Process multiple documents
- `generate_processing_report(result)`: Generate detailed report

## Output Format

```python
{
    'timestamp': '2024-01-20T10:30:00',
    'document_type': 'aadhaar',
    'overall_status': 'completed',  # completed, failed, completed_with_warnings
    'ocr_result': {
        'raw_text': 'extracted text...',
        'structured_text': ['line1', 'line2', ...],
        'confidence_scores': [0.95, 0.87, ...],
        'bounding_boxes': [[[x1,y1], [x2,y2], ...], ...]
    },
    'parsed_data': {
        'name': 'John Doe',
        'number': '1234 5678 9012',
        'dob': '15/08/1990'
    },
    'face_validation': {
        'is_valid': True,
        'face_analysis': {
            'face_count': 1,
            'position_correct': True,
            'quality_check': {
                'blur_score': 150.5,
                'brightness': 128.3,
                'is_good_quality': True
            }
        }
    },
    'errors': [],
    'warnings': ['Face position may not be standard']
}
```

## Configuration

### OCR Settings
- Language: Default 'en', supports 'hi' for Hindi
- Use angle classification: Enabled by default
- Preprocessing: Automatic noise reduction and contrast enhancement

### Face Detection Settings
- Primary method: face_recognition library
- Fallback: OpenCV Haar cascades
- Quality thresholds: Configurable blur/brightness limits

## Error Handling

The system provides comprehensive error handling:
- **OCR Errors**: Image format issues, text extraction failures
- **Face Detection Errors**: No face found, multiple faces, poor quality
- **Validation Errors**: Invalid document format, missing required fields

## Performance

- **OCR**: ~2-3 seconds per document
- **Face Detection**: ~1-2 seconds per document
- **Memory Usage**: ~200-500MB depending on image size
- **Supported Formats**: JPEG, PNG, BMP, TIFF

## Extending the System

### Adding New Document Types

1. Add patterns to `DocumentParser.patterns`
2. Update validation rules in `validate_document_data`
3. Add face position expectations in `DocumentFaceValidator`

### Custom OCR Preprocessing

```python
def custom_preprocess(image_path):
    image = cv2.imread(image_path)
    # Add custom preprocessing steps
    return processed_image_path

ocr_service = OCRService()
# Override preprocessing method
ocr_service.preprocess_image = custom_preprocess
```

## Troubleshooting

### Common Issues

1. **ImportError**: Install missing dependencies from requirements.txt
2. **Poor OCR Results**: Try different image preprocessing settings
3. **Face Not Detected**: Check image quality and face visibility
4. **Low Confidence**: Improve image resolution and lighting

### Performance Optimization

- Use GPU-enabled PaddlePaddle for faster OCR
- Implement image resizing for large documents
- Cache preprocessing results for repeated processing
- Use batch processing for multiple documents

## Security Considerations

- Input validation for image files
- No persistent storage of sensitive data
- Secure handling of document images
- Error messages don't expose sensitive information