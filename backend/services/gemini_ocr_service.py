"""
Gemini AI-powered OCR Service
Uses Google's Gemini AI for advanced document text extraction and analysis
"""

import os
import google.generativeai as genai
from PIL import Image
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiOCRService:
    """Service for OCR using Google Gemini AI"""

    def __init__(self):
        """Initialize Gemini OCR service with API key"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text from document image using Gemini AI

        Args:
            image_path: Path to the document image

        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            # Load image
            image = Image.open(image_path)

            # Create prompt for text extraction
            prompt = """
            Extract all text from this document image.
            Please provide:
            1. All text content in the document
            2. Document structure (if identifiable)
            3. Any numbers, dates, or special identifiers

            Return the response in a clear format.
            """

            # Generate response
            response = self.model.generate_content([prompt, image])

            return {
                'success': True,
                'raw_text': response.text,
                'method': 'gemini',
                'confidence': 0.95  # Gemini typically has high confidence
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_text': '',
                'method': 'gemini'
            }

    def extract_structured_data(self, image_path: str, document_type: str) -> Dict[str, Any]:
        """
        Extract structured data based on document type using Gemini AI

        Args:
            image_path: Path to the document image
            document_type: Type of document (aadhaar, pan, driving_license, passport, voter_id)

        Returns:
            Dictionary containing structured extracted data
        """
        try:
            image = Image.open(image_path)

            # Document-specific prompts
            prompts = {
                'aadhaar': """
                This is an Indian Aadhaar Card. Extract the following information in JSON format:
                {
                    "name": "full name",
                    "aadhaar_number": "12-digit number (format: XXXX XXXX XXXX)",
                    "dob": "date of birth (DD/MM/YYYY)",
                    "gender": "Male/Female",
                    "address": "full address"
                }
                Only return valid JSON. If a field is not found, use null.
                """,

                'pan': """
                This is an Indian PAN Card. Extract the following information in JSON format:
                {
                    "name": "full name",
                    "pan_number": "10-character PAN (format: ABCDE1234F)",
                    "father_name": "father's name",
                    "dob": "date of birth (DD/MM/YYYY)"
                }
                Only return valid JSON. If a field is not found, use null.
                """,

                'driving_license': """
                This is an Indian Driving License. Extract the following information in JSON format:
                {
                    "name": "full name",
                    "license_number": "license number",
                    "dob": "date of birth (DD/MM/YYYY)",
                    "issue_date": "issue date",
                    "validity": "validity date",
                    "address": "address",
                    "blood_group": "blood group"
                }
                Only return valid JSON. If a field is not found, use null.
                """,

                'passport': """
                This is an Indian Passport. Extract the following information in JSON format:
                {
                    "name": "full name",
                    "passport_number": "passport number",
                    "dob": "date of birth (DD/MM/YYYY)",
                    "issue_date": "date of issue",
                    "expiry_date": "date of expiry",
                    "place_of_birth": "place of birth",
                    "nationality": "nationality"
                }
                Only return valid JSON. If a field is not found, use null.
                """,

                'voter_id': """
                This is an Indian Voter ID Card. Extract the following information in JSON format:
                {
                    "name": "full name",
                    "voter_id": "voter ID number",
                    "dob": "date of birth (DD/MM/YYYY)",
                    "gender": "Male/Female",
                    "address": "address"
                }
                Only return valid JSON. If a field is not found, use null.
                """
            }

            prompt = prompts.get(document_type, prompts['aadhaar'])

            # Generate response
            response = self.model.generate_content([prompt, image])

            # Parse JSON from response
            response_text = response.text.strip()

            # Extract JSON from markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()

            parsed_data = json.loads(response_text)

            return {
                'success': True,
                'document_type': document_type,
                'parsed_data': parsed_data,
                'raw_response': response.text,
                'method': 'gemini'
            }

        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'JSON parsing error: {str(e)}',
                'raw_response': response.text if 'response' in locals() else '',
                'method': 'gemini'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'method': 'gemini'
            }

    def validate_document(self, image_path: str, document_type: str) -> Dict[str, Any]:
        """
        Validate document authenticity and quality using Gemini AI

        Args:
            image_path: Path to the document image
            document_type: Type of document

        Returns:
            Dictionary containing validation results
        """
        try:
            image = Image.open(image_path)

            prompt = f"""
            Analyze this {document_type} document image and provide validation:

            1. Is the image clear and readable? (quality check)
            2. Does it appear to be a genuine document? (authenticity check)
            3. Are there any signs of tampering or forgery?
            4. Is the document format consistent with official {document_type} documents?
            5. Overall confidence score (0-100)

            Provide response in JSON format:
            {{
                "is_clear": true/false,
                "appears_genuine": true/false,
                "tampering_detected": true/false,
                "format_valid": true/false,
                "confidence_score": 0-100,
                "notes": "any additional observations"
            }}
            """

            response = self.model.generate_content([prompt, image])
            response_text = response.text.strip()

            # Extract JSON from markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()

            validation_data = json.loads(response_text)

            return {
                'success': True,
                'validation': validation_data,
                'method': 'gemini'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'method': 'gemini'
            }


# Singleton instance
_gemini_service = None

def get_gemini_service() -> GeminiOCRService:
    """Get or create GeminiOCRService instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiOCRService()
    return _gemini_service
