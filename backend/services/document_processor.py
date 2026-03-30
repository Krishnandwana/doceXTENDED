"""
Document Processor
Main processing pipeline that orchestrates OCR, parsing, and validation
"""

import uuid
from datetime import datetime
from typing import Dict, Any

from .paddle_ocr_service import get_paddle_service
from .document_parser import get_document_parser
from .face_detection_service import get_face_service


class DocumentProcessor:
    """Main document processing pipeline"""

    def __init__(self):
        """Initialize document processor"""
        self.paddle_service = get_paddle_service()
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
        Process a document through the complete pipeline.

        Args:
            image_path: Path to document image
            document_type: Type of document (aadhaar, pan, etc.)
            use_gemini: Deprecated flag kept for API compatibility
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
            # Step 1: Authenticity check (offline heuristic detector)
            try:
                from .offline_ai_detector import get_offline_detector
                detector = get_offline_detector()
                authenticity_result = detector.detect(image_path)
                if authenticity_result.get('success'):
                    result['authenticity_check'] = authenticity_result.get('authenticity', {})
                    if result['authenticity_check'].get('is_ai_generated', False):
                        result['warnings'].append("Image may be AI-generated.")
                else:
                    result['warnings'].append("Could not perform image authenticity check.")
            except Exception:
                result['warnings'].append("Could not perform image authenticity check.")

            # Step 2: OCR extraction with PaddleOCR
            if use_gemini:
                result['warnings'].append("`use_gemini` is deprecated; PaddleOCR is used.")

            ocr_result = self.paddle_service.extract_text(image_path, preprocess=True)
            if ocr_result.get('success'):
                result['ocr_result'] = ocr_result
                raw_text = ocr_result.get('raw_text', '')
                result['parsed_data'] = self.parser.parse_document(raw_text, document_type)
            else:
                result['errors'].append(f"PaddleOCR failed: {ocr_result.get('error', 'Unknown error')}")

            # Step 3: Validate parsed data
            if result['parsed_data']:
                validation = self.parser.validate_document_data(result['parsed_data'], document_type)
                result['validation'] = validation

                if not validation['is_valid']:
                    result['errors'].extend(validation['errors'])
                result['warnings'].extend(validation['warnings'])

                if document_type == 'bill':
                    bill_verification = self.parser.verify_bill_total(result['parsed_data'])
                    result['bill_verification'] = bill_verification
                    if bill_verification.get('success') and not bill_verification.get('is_total_correct'):
                        result['errors'].append("Bill total does not match the sum of line items.")
            else:
                result['errors'].append("No data could be extracted from document")

            # Step 4: Face detection for non-bill docs
            if detect_face and document_type != 'bill' and self.face_service:
                face_result = self.face_service.detect_faces(image_path)

                if face_result['success']:
                    result['face_detection'] = {
                        'face_count': face_result['face_count'],
                        'primary_face_encoding': face_result.get('primary_face_encoding'),
                        'face_locations': face_result.get('face_locations', [])
                    }

                    quality_result = self.face_service.analyze_face_quality(image_path)
                    if quality_result['success']:
                        result['face_detection']['quality'] = quality_result

                    liveness_result = self.face_service.detect_liveness(image_path)
                    if liveness_result['success']:
                        result['face_detection']['liveness'] = liveness_result
                else:
                    result['warnings'].append(f"Face detection failed: {face_result.get('error', 'Unknown error')}")
            elif detect_face and document_type != 'bill' and not self.face_service:
                result['warnings'].append("Face detection service not available")

            # Step 5: Determine overall status
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
        """Verify if face in document matches live photo."""
        try:
            if not self.face_service:
                return {
                    'success': False,
                    'error': 'Face detection service not available'
                }

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

            liveness = self.face_service.detect_liveness(live_photo_path)
            faces_match = comparison['is_match'] and comparison['similarity_percentage'] >= 50.0

            return {
                'success': True,
                'faces_match': faces_match,
                'similarity_percentage': comparison['similarity_percentage'],
                'face_distance': comparison['face_distance'],
                'confidence': comparison['confidence'],
                'liveness_check': liveness if liveness['success'] else None,
                'timestamp': datetime.now().isoformat()
            }

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
        """Process multiple documents in batch."""
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
        """Generate a human-readable report from processing results."""
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
    """Get or create DocumentProcessor instance."""
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor
