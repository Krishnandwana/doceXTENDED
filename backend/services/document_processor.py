\
\
\
   

import uuid
from datetime import datetime
from typing import Dict, Any
import os
import tempfile

import cv2
from ai.document_classifier import get_document_classifier
from ai.fraud_detection_service import get_fraud_detection_service
from ai.secondry_ocr_service import get_secondry_ocr_service
from ai.name_id_extractor import get_name_id_extractor
from ai.paddle_ocr_service import get_paddle_service
from ai.postprocessing.explainability import build_explainability_report
from ai.postprocessing.field_normalizer import normalize_document_fields
from ai.postprocessing.result_fusion import fuse_results
from ai.preprocessing.image_cleaner import preprocess_document_image
from ai.quality_assessment_service import get_quality_assessment_service
from .document_parser import get_document_parser
from ai.face_detection_service import get_face_service


class DocumentProcessor:
                                           

    def __init__(self):
                                           
        self.init_warnings = []

        self.paddle_service = None
        try:
            self.paddle_service = get_paddle_service()
        except Exception as e:
            self.init_warnings.append(f"OCR service unavailable: {str(e)}")

        self.parser = get_document_parser()
        self.classifier = get_document_classifier()
        self.extractor = get_name_id_extractor()
        self.gemini_ocr_service = None
        try:
            self.gemini_ocr_service = get_secondry_ocr_service()
        except Exception as e:
            self.init_warnings.append(f"Gemini OCR service unavailable: {str(e)}")
        self.face_service = None
        try:
            self.face_service = get_face_service()
        except Exception as e:
            self.init_warnings.append(f"Face service unavailable: {str(e)}")
        self.fraud_service = get_fraud_detection_service()
        self.quality_service = get_quality_assessment_service()

    def process_document(
        self,
        image_path: str,
        document_type: str,
        use_gemini: bool = True,
        detect_face: bool = True
    ) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
\
\
\
           
        result = {
            'timestamp': datetime.now().isoformat(),
            'document_type': document_type,
            'overall_status': 'processing',
            'ocr_result': {},
            'parsed_data': {},
            'validation': {},
            'face_detection': {},
            'authenticity_check': {},
            'quality_check': {},
            'analysis': {},
            'bill_verification': {},
            'errors': [],
            'warnings': []
        }
        if self.init_warnings:
            result['warnings'].extend(self.init_warnings)

        try:
                                                   
            try:
                fraud_result = self.fraud_service.analyze(image_path)
                quality_result = self.quality_service.assess(image_path)

                if fraud_result.get('success'):
                    suspicious_score = float(fraud_result.get('suspicious_score', 0.0))
                    is_suspicious = bool(fraud_result.get('is_suspicious', False))
                    risk_level = str(fraud_result.get('risk_level', 'low'))
                    review_recommended = bool(fraud_result.get('review_recommended', False))
                    result['authenticity_check'] = {
                        'is_ai_generated': is_suspicious,
                        'is_authentic': not is_suspicious,
                        'confidence_score': int(round((suspicious_score if is_suspicious else (1.0 - suspicious_score)) * 100)),
                        'risk_level': risk_level,
                        'review_recommended': review_recommended,
                        'explanation': fraud_result.get('reason', ''),
                        'detection_method': 'ai_fraud_detection_service',
                        'signals': fraud_result.get('signals', {}),
                    }
                    if is_suspicious:
                        result['warnings'].append("Image may be AI-generated or tampered.")
                else:
                    result['warnings'].append("Could not perform image authenticity check.")

                if quality_result.get('success'):
                    result['quality_check'] = quality_result
            except Exception:
                result['warnings'].append("Could not perform image authenticity check.")

                                                                              
            if use_gemini:
                result['warnings'].append("`use_gemini` is deprecated; PaddleOCR is used.")

            ocr_result = None
            if self.paddle_service is None:
                result['errors'].append("PaddleOCR unavailable: model source unavailable or startup failed")
            else:
                temp_preprocessed = None
                try:
                    image = cv2.imread(image_path)
                    if image is not None:
                        processed = preprocess_document_image(image)
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                            temp_preprocessed = tmp.name
                        cv2.imwrite(temp_preprocessed, processed)
                        ocr_result = self.paddle_service.extract_text(temp_preprocessed, preprocess=False)

                                                                             
                    if not ocr_result or not ocr_result.get('success'):
                        ocr_result = self.paddle_service.extract_text(image_path, preprocess=True)
                finally:
                    if temp_preprocessed and os.path.exists(temp_preprocessed):
                        try:
                            os.remove(temp_preprocessed)
                        except Exception:
                            pass

                if ocr_result and ocr_result.get('success'):
                    result['ocr_result'] = ocr_result
                    raw_text = ocr_result.get('raw_text', '')
                    structured_lines = ocr_result.get('structured_text', []) or []
                    parse_text = "\n".join(structured_lines) if structured_lines else raw_text

                                                                                   
                    classification = self.classifier.classify(parse_text)
                    extracted = self.extractor.extract(parse_text, document_type, structured_lines=structured_lines)
                    parsed_data = self.parser.parse_document(parse_text, document_type)

                    merged = dict(parsed_data or {})
                    extracted_fields = (extracted.get('fields', {}) or {})
                    if extracted_fields.get('name') and not merged.get('name'):
                        merged['name'] = extracted_fields.get('name')
                    if extracted_fields.get('date_of_birth') and not merged.get('dob'):
                        merged['dob'] = extracted_fields.get('date_of_birth')

                    id_field_map = {
                        'aadhaar': 'aadhaar_number',
                        'pan': 'pan_number',
                        'driving_license': 'license_number',
                        'passport': 'passport_number',
                        'voter_id': 'voter_id',
                    }
                    id_field = id_field_map.get(document_type)
                    if id_field and extracted_fields.get('id_number') and not merged.get(id_field):
                        merged[id_field] = extracted_fields.get('id_number')

                    merged = normalize_document_fields(merged)
                    result['parsed_data'] = merged

                                                                         
                    if classification.get('success'):
                        predicted = classification.get('document_type')
                        cls_conf = float(classification.get('confidence', 0.0))
                        if predicted and predicted != 'unknown' and predicted != document_type and cls_conf >= 0.66:
                            result['warnings'].append(
                                f"Document appears to be '{predicted}' (confidence {cls_conf:.2f}) instead of '{document_type}'."
                            )

                                                                                 
                    ocr_conf = float(result['ocr_result'].get('average_confidence', 0.0))
                    ocr_conf = ocr_conf if ocr_conf <= 1.0 else (ocr_conf / 100.0)
                    parser_conf = min(1.0, max(0.0, len([v for v in merged.values() if v]) / 5.0))
                    quality_conf = float(result.get('quality_check', {}).get('quality_score', 0.0))
                    classifier_conf = float(classification.get('confidence', 0.0)) if classification.get('success') else 0.0

                    components = {
                        'ocr': {'confidence': ocr_conf},
                        'parser': {'confidence': parser_conf},
                        'classifier': {'confidence': classifier_conf},
                        'quality': {'confidence': quality_conf},
                    }

                    fused = fuse_results(components)
                    explainability = build_explainability_report(fused, components)
                    result['analysis'] = {
                        'document_classification': classification,
                        'field_extraction': extracted,
                        'fused_decision': fused,
                        'explainability': explainability,
                    }

                                                                        
                    if use_gemini and self.gemini_ocr_service and getattr(self.gemini_ocr_service, "available", False):
                        gemini_result = self.gemini_ocr_service.extract_text(image_path)
                        if gemini_result.get("success"):
                            gemini_raw = gemini_result.get("raw_text", "")
                            gemini_lines = gemini_result.get("structured_text", []) or []
                            gemini_parse_text = "\n".join(gemini_lines) if gemini_lines else gemini_raw
                            gemini_extracted = self.extractor.extract(
                                gemini_parse_text, document_type, structured_lines=gemini_lines
                            )
                            gemini_parsed = self.parser.parse_document(gemini_parse_text, document_type)

                            paddle_fields = (extracted.get("fields", {}) or {})
                            gemini_fields = (gemini_extracted.get("fields", {}) or {})
                            id_match = (
                                bool(paddle_fields.get("id_number"))
                                and bool(gemini_fields.get("id_number"))
                                and str(paddle_fields.get("id_number")).upper() == str(gemini_fields.get("id_number")).upper()
                            )
                            name_match = (
                                bool(paddle_fields.get("name"))
                                and bool(gemini_fields.get("name"))
                                and str(paddle_fields.get("name")).strip().lower() == str(gemini_fields.get("name")).strip().lower()
                            )

                            result["gemini_validation"] = {
                                "success": True,
                                "cross_check_enabled": True,
                                "paddle_method": result["ocr_result"].get("method"),
                                "gemini_method": gemini_result.get("method"),
                                "paddle_fields": paddle_fields,
                                "gemini_fields": gemini_fields,
                                "name_match": bool(name_match),
                                "id_match": bool(id_match),
                                "gemini_parsed_data": gemini_parsed,
                            }
                            if not name_match:
                                result["warnings"].append("Name differs between Paddle OCR and Gemini OCR cross-check.")
                            if not id_match:
                                result["warnings"].append("ID number differs between Paddle OCR and Gemini OCR cross-check.")
                        else:
                            result["gemini_validation"] = {
                                "success": False,
                                "cross_check_enabled": True,
                                "error": gemini_result.get("error", "Gemini OCR cross-check failed"),
                            }
                else:
                    result['errors'].append(f"PaddleOCR failed: {(ocr_result or {}).get('error', 'Unknown error')}")

                                          
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
        quality_check = processing_result.get('quality_check', {})
        if quality_check:
            metrics = quality_check.get('metrics', {})
            report_lines.extend([
                "",
                "-" * 60,
                "QUALITY CHECK",
                "-" * 60,
                f"Good Quality: {quality_check.get('is_good_quality', 'Unknown')}",
                f"Quality Score: {quality_check.get('quality_score', 'N/A')}",
                f"Blur Score: {metrics.get('blur_score', 'N/A')}",
                f"Glare Ratio: {metrics.get('glare_ratio', 'N/A')}"
            ])

        analysis = processing_result.get('analysis', {})
        if analysis:
            classification = analysis.get('document_classification', {})
            fused = analysis.get('fused_decision', {})
            report_lines.extend([
                "",
                "-" * 60,
                "DOCUMENT ANALYSIS",
                "-" * 60,
                f"Predicted Type: {classification.get('document_type', 'unknown')}",
                f"Classifier Confidence: {classification.get('confidence', 'N/A')}",
                f"Decision: {fused.get('decision', 'N/A')}",
                f"Fused Confidence: {fused.get('fused_confidence', 'N/A')}",
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


_processor = None


def get_document_processor() -> DocumentProcessor:
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor
