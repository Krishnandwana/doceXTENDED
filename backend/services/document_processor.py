"""
Document Processor
Main processing pipeline that orchestrates OCR, parsing, and validation
"""

import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

from .gemini_ocr_service import get_gemini_service
# from .paddle_ocr_service import get_paddle_service
from .document_parser import get_document_parser
from .face_detection_service import get_face_service


class DocumentProcessor:
    """Main document processing pipeline"""

    def __init__(self):
        """Initialize document processor"""
        self.gemini_service = get_gemini_service()
        # self.paddle_service = get_paddle_service()
        self.parser = get_document_parser()
        self.face_service = get_face_service()

    def process_document(
        self,
        image_path: str,
        document_type: str,
        use_gemini: bool = True,
        detect_face: bool = True
    ) -> Dict[str, Any]:
        """
        Process a document through the complete pipeline

        Args:
            image_path: Path to document image
            document_type: Type of document (aadhaar, pan, etc.)
            use_gemini: Whether to use Gemini AI (default) or PaddleOCR
            detect_face: Whether to perform face detection

        Returns:
            Dictionary containing all processing results
        """
        result = {
            'timestamp': datetime.now().isoformat(),
            'document_type': document_type,
            'overall_status': 'processing',
            'ocr_result': {},
            'parsed_data': {},
            'validation': {},
            'face_detection': {},
            'authenticity_check': {},
            'bill_verification': {},
            'errors': [],
            'warnings': []
        }

        try:
            # Step 1: Authenticity Check
            authenticity_result = self.gemini_service.check_image_authenticity(image_path)
            if authenticity_result['success']:
                result['authenticity_check'] = authenticity_result['authenticity']
                if authenticity_result['authenticity'].get('is_ai_generated', False):
                    result['warnings'].append("Image may be AI-generated.")
            else:
                result['warnings'].append("Could not perform image authenticity check.")

            # Step 2: OCR Extraction
            if use_gemini:
                # Use Gemini for structured extraction
                ocr_result = self.gemini_service.extract_structured_data(
                    image_path,
                    document_type
                )

                if ocr_result['success']:
                    result['ocr_result'] = {
                        'method': 'gemini',
                        'raw_response': ocr_result.get('raw_response', ''),
                        'success': True
                    }
                    result['parsed_data'] = ocr_result.get('parsed_data', {})

                    # Also get validation from Gemini
                    validation_result = self.gemini_service.validate_document(
                        image_path,
                        document_type
                    )
                    if validation_result['success']:
                        gemini_validation = validation_result.get('validation', {})
                        result['gemini_validation'] = gemini_validation

                else:
                    result['errors'].append(f"Gemini OCR failed: {ocr_result.get('error', 'Unknown error')}")
                    # result['warnings'].append("Falling back to PaddleOCR")
                    # use_gemini = False

            # if not use_gemini:
            #     # Fallback to PaddleOCR
            #     ocr_result = self.paddle_service.extract_text(image_path, preprocess=True)

            #     if ocr_result['success']:
            #         result['ocr_result'] = ocr_result

            #         # Parse the extracted text
            #         parsed_data = self.parser.parse_document(
            #             ocr_result['raw_text'],
            #             document_type
            #         )
            #         result['parsed_data'] = parsed_data
            #     else:
            #         result['errors'].append(f"PaddleOCR failed: {ocr_result.get('error', 'Unknown error')}")

            # Step 3: Validate Parsed Data
            if result['parsed_data']:
                validation = self.parser.validate_document_data(
                    result['parsed_data'],
                    document_type
                )
                result['validation'] = validation

                if not validation['is_valid']:
                    result['errors'].extend(validation['errors'])
                result['warnings'].extend(validation['warnings'])

                # If it's a bill, verify the total
                if document_type == 'bill':
                    bill_verification = self.parser.verify_bill_total(result['parsed_data'])
                    result['bill_verification'] = bill_verification
                    if bill_verification.get('success') and not bill_verification.get('is_total_correct'):
                        result['errors'].append("Bill total does not match the sum of line items.")

            else:
                result['errors'].append("No data could be extracted from document")

            # Step 4: Face Detection (only for ID documents)
            if detect_face and document_type != 'bill':
                face_result = self.face_service.detect_faces(image_path)

                if face_result['success']:
                    result['face_detection'] = {
                        'face_count': face_result['face_count'],
                        'primary_face_encoding': face_result.get('primary_face_encoding'),
                        'face_locations': face_result.get('face_locations', [])
                    }

                    # Analyze face quality
                    quality_result = self.face_service.analyze_face_quality(image_path)
                    if quality_result['success']:
                        result['face_detection']['quality'] = quality_result

                    # Basic liveness detection
                    liveness_result = self.face_service.detect_liveness(image_path)
                    if liveness_result['success']:
                        result['face_detection']['liveness'] = liveness_result
                else:
                    result['warnings'].append(f"Face detection failed: {face_result.get('error', 'Unknown error')}")

            # Step 5: Determine Overall Status
            if result['errors']:
                result['overall_status'] = 'completed_with_errors'
            elif result['warnings']:
                result['overall_status'] = 'completed_with_warnings'
            else:
                result['overall_status'] = 'completed'

        except Exception as e:
            result['overall_status'] = 'failed'
            result['errors'].append(f"Processing failed: {str(e)}")

        return result

    def verify_faces(
        self,
        document_image_path: str,
        live_photo_path: str,
        tolerance: float = 0.6
    ) -> Dict[str, Any]:
        """
        Verify if face in document matches live photo

        Args:
            document_image_path: Path to document with face
            live_photo_path: Path to live photo
            tolerance: Matching tolerance

        Returns:
            Dictionary containing verification results
        """
        try:
            # Compare faces
            comparison = self.face_service.compare_faces(
                document_image_path,
                live_photo_path,
                tolerance
            )

            if not comparison['success']:
                return {
                    'success': False,
                    'error': comparison.get('error', 'Face comparison failed')
                }

            # Check liveness of live photo
            liveness = self.face_service.detect_liveness(live_photo_path)

            result = {
                'success': True,
                'faces_match': comparison['is_match'],
                'similarity_percentage': comparison['similarity_percentage'],
                'face_distance': comparison['face_distance'],
                'confidence': comparison['confidence'],
                'liveness_check': liveness if liveness['success'] else None,
                'timestamp': datetime.now().isoformat()
            }

            return result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def batch_process_documents(
        self,
        documents: list[Dict[str, str]],
        use_gemini: bool = True
    ) -> Dict[str, Any]:
        """
        Process multiple documents in batch

        Args:
            documents: List of dicts with 'image_path' and 'document_type'
            use_gemini: Whether to use Gemini AI

        Returns:
            Dictionary containing batch processing results
        """
        results = []
        summary = {
            'total': len(documents),
            'successful': 0,
            'failed': 0,
            'with_warnings': 0
        }

        for doc in documents:
            result = self.process_document(
                doc['image_path'],
                doc['document_type'],
                use_gemini
            )

            results.append({
                'document_id': str(uuid.uuid4()),
                'image_path': doc['image_path'],
                'result': result
            })

            if result['overall_status'] == 'completed':
                summary['successful'] += 1
            elif result['overall_status'] == 'completed_with_warnings':
                summary['with_warnings'] += 1
            else:
                summary['failed'] += 1

        return {
            'summary': summary,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }

    def generate_report(self, processing_result: Dict[str, Any]) -> str:
        """
        Generate a human-readable report from processing results

        Args:
            processing_result: Result from process_document

        Returns:
            Formatted report string
        """
        report_lines = [
            "=" * 60,
            "DOCUMENT VERIFICATION REPORT",
            "=" * 60,
            f"Timestamp: {processing_result.get('timestamp', 'N/A')}",
            f"Document Type: {processing_result.get('document_type', 'Unknown').upper()}",
            f"Overall Status: {processing_result.get('overall_status', 'Unknown').upper()}",
            "",
            "-" * 60,
            "EXTRACTED INFORMATION",
            "-" * 60
        ]

        # Add parsed data
        parsed_data = processing_result.get('parsed_data', {})
        if parsed_data:
            for key, value in parsed_data.items():
                report_lines.append(f"{key.replace('_', ' ').title()}: {value}")
        else:
            report_lines.append("No data extracted")

        report_lines.extend([
            "",
            "-" * 60,
            "VALIDATION RESULTS",
            "-" * 60
        ])

        # Add validation info
        validation = processing_result.get('validation', {})
        if validation:
            report_lines.append(f"Valid: {validation.get('is_valid', False)}")
            if validation.get('errors'):
                report_lines.append("\nErrors:")
                for error in validation['errors']:
                    report_lines.append(f"  - {error}")
            if validation.get('warnings'):
                report_lines.append("\nWarnings:")
                for warning in validation['warnings']:
                    report_lines.append(f"  - {warning}")
        else:
            report_lines.append("No validation performed")

        # Add authenticity check info
        authenticity_check = processing_result.get('authenticity_check', {})
        if authenticity_check:
            report_lines.extend([
                "",
                "-" * 60,
                "IMAGE AUTHENTICITY CHECK",
                "-" * 60,
                f"AI Generated: {authenticity_check.get('is_ai_generated', 'Unknown')}",
                f"Confidence: {authenticity_check.get('confidence_score', 'N/A')}",
                f"Explanation: {authenticity_check.get('explanation', 'N/A')}"
            ])

        # Add bill verification info
        bill_verification = processing_result.get('bill_verification', {})
        if bill_verification and bill_verification.get('success'):
            report_lines.extend([
                "",
                "-" * 60,
                "BILL VERIFICATION",
                "-" * 60,
                f"Stated Total: {bill_verification.get('stated_total')}",
                f"Calculated Total: {bill_verification.get('calculated_total')}",
                f"Total Correct: {bill_verification.get('is_total_correct')}",
                f"Discrepancy: {bill_verification.get('discrepancy')}"
            ])

        # Add face detection info
        face_detection = processing_result.get('face_detection', {})
        if face_detection:
            report_lines.extend([
                "",
                "-" * 60,
                "FACE DETECTION",
                "-" * 60,
                f"Faces Detected: {face_detection.get('face_count', 0)}"
            ])

            if 'quality' in face_detection:
                quality = face_detection['quality']
                report_lines.append(f"Face Quality: {'Good' if quality.get('is_good_quality') else 'Poor'}")

            if 'liveness' in face_detection:
                liveness = face_detection['liveness']
                report_lines.append(f"Liveness: {'Live' if liveness.get('is_live') else 'Uncertain'}")

        report_lines.extend([
            "",
            "=" * 60,
            "END OF REPORT",
            "=" * 60
        ])

        return "\n".join(report_lines)


# Singleton instance
_processor = None

def get_document_processor() -> DocumentProcessor:
    """Get or create DocumentProcessor instance"""
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor
