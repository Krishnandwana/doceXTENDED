# Streamlit Document Verification Interface

## Overview
A comprehensive web interface for the Document Verification System built with Streamlit, providing an intuitive UI for document processing, OCR extraction, and validation.

## Features

### 1. Document Upload & Processing
- Single document upload with drag-and-drop support
- Real-time processing status with progress bar
- Automatic result display upon completion
- Support for JPEG, PNG, BMP, TIFF formats

### 2. OCR-Only Extraction
- Extract text without full document processing
- Optional image preprocessing
- Confidence score analysis with visualizations
- Raw text display and structured text output

### 3. Batch Processing
- Upload multiple documents simultaneously
- Configure document types for each file
- Parallel processing with progress tracking
- Summary statistics and results table

### 4. Document Validation
- Manual data entry for validation
- Type-specific form fields
- Real-time validation feedback
- Field-level validation details

### 5. Analytics Dashboard
- Job status distribution pie chart
- Processing timeline visualization
- Success rate metrics
- Document type statistics

## Installation

### Prerequisites
- Python 3.8+
- FastAPI backend running (see API documentation)

### Setup Steps

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Start the FastAPI Backend**
```bash
python run_api.py
```

3. **Run Streamlit App**
```bash
streamlit run streamlit_app.py
```

### Alternative: Run Both Together
```bash
./run_streamlit.sh
```

## Usage Guide

### Quick Start
1. Open browser at `http://localhost:8501`
2. Check API status in sidebar (should show green checkmark)
3. Navigate to "Upload & Process" tab
4. Upload a document image
5. Select document type
6. Click "Process Document"
7. View results and extracted information

### Tab Descriptions

#### Upload & Process Tab
- **Purpose**: Main document processing workflow
- **Steps**:
  1. Upload document image
  2. Select document type (Aadhaar/PAN/DL)
  3. Click "Process Document"
  4. Monitor progress bar
  5. View extracted data and validation results
  6. Generate detailed report if needed

#### OCR Only Tab
- **Purpose**: Extract text without validation
- **Features**:
  - Preprocessing toggle
  - Confidence score distribution
  - Raw text output
  - Statistical metrics

#### Batch Processing Tab
- **Purpose**: Process multiple documents
- **Workflow**:
  1. Upload multiple files
  2. Configure document types in table
  3. Process all documents
  4. View batch results summary

#### Validation Tab
- **Purpose**: Validate document data manually
- **Use Cases**:
  - Testing validation rules
  - Manual data verification
  - Understanding field requirements

#### Analytics Tab
- **Purpose**: Monitor system performance
- **Metrics**:
  - Job status distribution
  - Processing timeline
  - Success rates
  - Document statistics

## Interface Components

### Sidebar
- **System Status**: API health check
- **Statistics**: Real-time metrics
- **Supported Documents**: List of document types

### Main Area
- **Tabbed Interface**: Organized functionality
- **Interactive Forms**: Dynamic input fields
- **Visual Feedback**: Progress bars, status badges
- **Data Visualization**: Charts and graphs

### Status Indicators
- ✅ **Success**: Green badges/text
- ⚠️ **Warning**: Yellow badges/text
- ❌ **Error**: Red badges/text
- ℹ️ **Info**: Blue badges/text

## Configuration

### Environment Variables
```bash
# API Configuration (optional)
export API_BASE_URL="http://localhost:8000"

# Streamlit Configuration
export STREAMLIT_SERVER_PORT=8501
export STREAMLIT_SERVER_ADDRESS=localhost
```

### Streamlit Config File
Create `.streamlit/config.toml`:
```toml
[theme]
primaryColor = "#3B82F6"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F3F4F6"
textColor = "#1F2937"

[server]
port = 8501
enableCORS = false
enableXsrfProtection = true
```

## Troubleshooting

### Common Issues

1. **API Not Responding**
   - Ensure FastAPI is running: `python run_api.py`
   - Check API health: `curl http://localhost:8000/api/health`

2. **Upload Fails**
   - Verify file format (JPEG, PNG, BMP, TIFF)
   - Check file size (< 10MB recommended)
   - Ensure API has write permissions to upload directory

3. **Processing Stuck**
   - Check API logs for errors
   - Verify OCR dependencies installed
   - Ensure sufficient memory available

4. **Streamlit Won't Start**
   - Check port 8501 is available
   - Update Streamlit: `pip install --upgrade streamlit`
   - Clear cache: `streamlit cache clear`

### Performance Tips

1. **Image Optimization**
   - Resize large images before upload
   - Use JPEG for photos, PNG for documents
   - Ensure good image quality and lighting

2. **Batch Processing**
   - Limit to 10-20 documents per batch
   - Use consistent document types in batches
   - Monitor memory usage for large batches

3. **Browser Compatibility**
   - Use modern browsers (Chrome, Firefox, Edge)
   - Enable JavaScript
   - Allow cookies for session management

## Advanced Features

### Custom Styling
Modify CSS in `streamlit_app.py`:
```python
st.markdown("""
<style>
    /* Your custom CSS here */
</style>
""", unsafe_allow_html=True)
```

### Session Management
Access session state:
```python
# Store data
st.session_state['key'] = value

# Retrieve data
data = st.session_state.get('key', default_value)
```

### Export Results
Download processing results:
```python
# Add download button for results
st.download_button(
    label="Download Results",
    data=json.dumps(results, indent=2),
    file_name=f"results_{document_id}.json",
    mime="application/json"
)
```

## Security Considerations

1. **File Upload Security**
   - File type validation
   - Size limits enforced
   - Virus scanning (implement if needed)

2. **Data Privacy**
   - No persistent storage of sensitive data
   - Session isolation
   - Secure API communication

3. **Access Control**
   - Add authentication if needed
   - Implement user roles
   - Audit logging

## Support & Resources

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Backend Setup**: See `README_ML.md`
- **Issues**: Report bugs in GitHub repository
- **Updates**: Check for latest version regularly