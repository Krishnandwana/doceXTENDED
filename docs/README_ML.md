# ML/AI Overview

## Objective

Provide reliable identity verification intelligence with explainable outputs, centered on:
- ID document understanding
- ID face vs selfie face matching
- authenticity and quality risk signals

## AI Design Principles

- Modular services with clear ownership and interfaces.
- Explainability over opaque single-score decisions.
- Fallback behavior for operational resilience.
- Separate risk scoring from hard rejection whenever possible.

## AI Component Map

### 1. OCR and Text Extraction

Primary module:
- `ai/paddle_ocr_service.py`

Function:
- Extract raw and structured text from uploaded ID documents.

Output usage:
- Parsed by document parser/extractor.
- Used for name/ID extraction and classification.

### 2. Document Classification

Primary module:
- `ai/document_classifier.py`

Function:
- Predict document type from extracted text context.

Use case:
- Cross-check selected type and surface mismatch warnings.

### 3. Name and ID Extraction

Primary module:
- `ai/name_id_extractor.py`

Function:
- Hybrid extraction of name, DOB, and ID number from OCR text.
- Handles noisy OCR by combining rules and scoring logic.

### 4. Face Verification Pipeline

Primary module:
- `ai/face_detection_service.py`

Flow:
1. detect face in document/selfie
2. crop and align face region
3. compute embedding
4. compare embeddings with cosine or distance metric
5. return similarity and decision confidence

### 5. Liveness Support

Primary module:
- `ai/face_liveness_service.py`

Function:
- Provide anti-spoof-oriented checks/signals used in verification context.

### 6. Fraud / Authenticity Scoring

Primary module:
- `ai/fraud_detection_service.py`

Signals used:
- JPEG blockiness
- noise characteristics
- saturation ratio
- entropy
- edge density
- metadata-size heuristic

Output:
- `is_suspicious`
- `suspicious_score`
- `risk_level` (`low`, `medium`, `high`)
- `review_recommended`
- detailed signal dictionary
- human-readable reason string

### 7. Quality Assessment

Primary module:
- `ai/quality_assessment_service.py`

Signals used:
- blur score
- glare ratio
- clarity-oriented metrics

Output:
- `is_good_quality`
- `quality_score`
- quality metrics payload

### 8. Preprocessing

Primary module:
- `ai/preprocessing/image_cleaner.py`

Operations:
- denoise
- deskew
- contrast enhancement
- shadow reduction
- perspective correction

Purpose:
- improve OCR and downstream extraction reliability.

### 9. Postprocessing

Modules:
- `ai/postprocessing/field_normalizer.py`
- `ai/postprocessing/result_fusion.py`
- `ai/postprocessing/confidence_calibrator.py`
- `ai/postprocessing/explainability.py`

Function:
- normalize field formats
- fuse component confidence
- calibrate confidence values
- generate explainability reports

### 10. Config and Monitoring

Modules:
- `ai/model_registry.py`
- `ai/monitoring.py`

Function:
- central model configuration and thresholds
- timing/monitoring hooks for inference observability

## Inference Lifecycle

```text
Input Image
  -> Preprocessing
  -> OCR / Face / Quality / Fraud branches
  -> Parsing + Extraction
  -> Confidence Fusion + Calibration
  -> Explainable Decision Payload
```

## Current Decision Philosophy

- Avoid binary reject decisions on weak evidence.
- Use medium-risk review mode for borderline authenticity patterns.
- Preserve raw signals for auditability and future calibration.
- Keep feature outputs explicit so backend/frontend can apply policy.

## Evaluation and Testing

Current tests available:
- `ai/tests/test_document_classifier.py`
- `ai/tests/test_name_id_extractor.py`
- `ai/tests/test_postprocessing.py`

Fixtures:
- `ai/tests/fixtures/expected_outputs.json`

Recommended expansion:
- per-document-type OCR benchmark set
- face-match benchmark with varied lighting/pose
- fraud signal validation set with known genuine/forged examples
- threshold regression tests before release

## Known Limitations

- Heuristic fraud scoring requires larger labeled datasets for high-confidence deployment.
- OCR quality remains input-sensitive for low-light/blurred captures.
- Liveness checks should be strengthened with temporal/video signals for production-grade anti-spoofing.
- Calibration is currently rule/heuristic-guided and should evolve with empirical score distributions.

## Production Hardening Recommendations

- Add model version tracking and structured release notes.
- Record inference telemetry per component (latency, confidence histograms, drift indicators).
- Build offline evaluation jobs for threshold updates.
- Add per-tenant risk profile support (strict/standard/lenient).
- Introduce reviewer feedback loop to tune extraction and fraud thresholds.

## Suggested Metrics for ML Reporting

- OCR field extraction accuracy by field type.
- Face match precision/recall at selected threshold.
- False-positive rate for fraud detection.
- Manual-review rate per 1,000 verifications.
- p50/p95 model inference latency.
- Failure-rate by component (OCR/face/fraud/quality).

## PPT/Report Talking Points

- ML design is service-oriented, not monolithic, enabling safer iterative upgrades.
- Verification decisions are explainable through component signals and calibrated confidence.
- Current stack already supports practical KYC workflows with clear hardening roadmap.
- Biggest next leverage: data-driven calibration and monitoring maturity.
