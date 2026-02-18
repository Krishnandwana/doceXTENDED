"""Test Gemini extraction on a PAN card"""
import os
from pathlib import Path
from dotenv import load_dotenv
from backend.services.gemini_ocr_service import GeminiOCRService

load_dotenv()

# Find a recent PAN card upload
upload_dir = Path("data/uploads")
files = sorted(upload_dir.glob("*.jpg"), key=lambda x: x.stat().st_mtime, reverse=True)

if files:
    latest_file = files[0]
    print(f"Testing with: {latest_file}")
    
    # Initialize Gemini service
    gemini = GeminiOCRService()
    
    # Test structured extraction
    print("\n=== Testing Structured Extraction ===")
    result = gemini.extract_structured_data(str(latest_file), 'pan')
    print(f"Success: {result.get('success')}")
    print(f"Parsed Data: {result.get('parsed_data')}")
    print(f"Error: {result.get('error')}")
    
    # Test OCR extraction
    print("\n=== Testing OCR Text Extraction ===")
    ocr_result = gemini.extract_text(str(latest_file))
    print(f"Success: {ocr_result.get('success')}")
    print(f"Raw Text: {ocr_result.get('raw_text', '')[:500]}")
    print(f"Error: {ocr_result.get('error')}")
else:
    print("No uploaded files found")
