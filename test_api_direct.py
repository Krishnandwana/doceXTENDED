"""Test the extract-preview API endpoint directly"""
import requests
from pathlib import Path

# Find latest uploaded file
upload_dir = Path("data/uploads")
files = sorted(upload_dir.glob("*.jpg"), key=lambda x: x.stat().st_mtime, reverse=True)

if files:
    latest_file = files[0]
    print(f"Testing with: {latest_file.name}")
    
    # Step 1: Upload the file
    print("\n=== Step 1: Upload Document ===")
    with open(latest_file, 'rb') as f:
        upload_response = requests.post(
            'http://localhost:8000/api/documents/upload',
            files={'file': (latest_file.name, f, 'image/jpeg')}
        )
    
    print(f"Status: {upload_response.status_code}")
    print(f"Response: {upload_response.json()}")
    
    if upload_response.status_code == 200:
        doc_id = upload_response.json()['document_id']
        
        # Step 2: Extract preview
        print("\n=== Step 2: Extract Preview ===")
        preview_response = requests.post(
            'http://localhost:8000/api/documents/extract-preview',
            json={'document_id': doc_id, 'document_type': 'pan'}
        )
        
        print(f"Status: {preview_response.status_code}")
        print(f"Response: {preview_response.json()}")
else:
    print("No uploaded files found")
