# Project Overview

## Executive Summary

DocVerify is an API-first identity verification platform designed for fintech onboarding and KYC workflows.
The platform combines document intake, OCR-based field extraction, identity validation, face matching, and AI-based fraud/quality signals into one verification lifecycle.

Current product mode:
- Frontend is focused on ID verification flow.
- Backend supports both ID verification and advanced document-analysis endpoints.

## Problem Statement

Fintech onboarding teams commonly face:
- Low-quality document uploads causing extraction errors.
- Manual effort for ID-face vs selfie-face comparison.
- Inconsistent tampering/authenticity checks.
- Limited explainability for compliance and audit.

DocVerify addresses this with deterministic API stages and explainable outputs.

## Product Goals

- Reduce onboarding turnaround time.
- Improve automation quality for identity verification.
- Provide explainable signals for risk/compliance review.
- Keep architecture modular so AI components evolve independently.

## System Scope

### In Scope

- Document upload and file lifecycle handling.
- OCR extraction and structured field parsing.
- Rule-based field validation by document type.
- Face verification pipeline (ID face vs selfie).
- Quality scoring (blur, glare, clarity indicators).
- Fraud/authenticity scoring with risk levels.
- Async API job flow for heavy processing.

### Out of Scope (Current)

- Full production auth/rate-limits/multi-tenant billing.
- Persistent job replay orchestration.
- Full model governance and retraining platform.

## Target Users

- Fintech engineering teams integrating KYC APIs.
- Risk and compliance reviewers.
- Operations teams handling manual review.
- Product teams monitoring conversion and quality metrics.

## High-Level Architecture

```text
Client App / Operator UI
        |
        v
FastAPI Route Layer
(upload/process/status/results/match/preview)
        |
        v
Processing Orchestrator (document_processor)
        |
        +--> AI Services (ai/)
        |      - OCR
        |      - Face detection / embeddings
        |      - Fraud scoring
        |      - Quality scoring
        |      - Classifier / extractor
        |
        +--> Rule Parser + Validation
        |
        +--> Postprocessing + Explainability
```

## End-to-End User Flow

### Primary Flow (Current UI: ID Verification)

1. User uploads an ID image.
2. Backend stores file and returns `document_id`.
3. Frontend requests preview extraction (face crop + name + ID).
4. User confirms fields and captures selfie.
5. Face verification compares ID face with selfie face.
6. UI displays match result, confidence, and extracted identity fields.

### Advanced Flow (Backend-Available)

1. Upload document.
2. Start async processing job.
3. Poll status.
4. Fetch parsed fields, validation, fraud, and quality outputs.

## Core Components

### Frontend

- React route-based UI.
- ID verification step flow.
- API integration with timeout/error handling.
- Session-based bridge for face-verification handoff page.

### Backend

- FastAPI route layer with typed contracts.
- In-memory storage for uploads/jobs/results (current stage).
- Background processing orchestration.
- Unified payload composition for frontend/API clients.

### AI Layer

- OCR and line-level structuring.
- Face detection and embedding matching.
- Fraud/quality heuristics with risk-level output.
- Field normalization, confidence fusion, explainability.

## Strengths

- Modular AI service boundaries.
- Working end-to-end verification pipeline.
- Explainable response payloads.
- Clear expansion path for more document types and checks.

## Constraints

- In-memory state limits durability/scalability.
- Model startup/dependency availability impacts cold starts.
- Fraud heuristics require more dataset-driven calibration for production.
- UI currently prioritizes ID flow over full document-analysis UX.

## Risks and Mitigations

- Risk: Authenticity false positives.
  - Mitigation: Risk bands (`low`, `medium`, `high`) + manual-review state.
- Risk: OCR instability on poor images.
  - Mitigation: Preprocessing + quality checks + fallback extraction logic.
- Risk: Contract drift between backend/frontend.
  - Mitigation: Typed response models + shared docs.
- Risk: Timeout mismatch across layers.
  - Mitigation: Standardized timeout/polling behavior.

## KPI Suggestions

- Verification completion rate.
- Face match pass/fail distribution.
- OCR extraction completeness by document type.
- Manual review rate.
- End-to-end latency (p50/p95).
- Endpoint-level error rate.

## Roadmap

### Near Term

1. Persistent storage for documents/jobs/results.
2. Authentication, rate limiting, and audit logs.
3. Stronger liveness/anti-spoof checks.
4. Better field-level extraction confidence and explainability.

### Mid Term

1. Benchmark harness and regression datasets.
2. Monitoring dashboard for latency and drift.
3. SDKs for partner integration.
4. Versioned API lifecycle.

### Long Term

1. Human-in-the-loop review workflow.
2. Continuous calibration using reviewer feedback.
3. Tenant-level risk policy controls.

## PPT/Report Talking Points

- DocVerify unifies KYC-critical checks into one API system.
- Architecture is modular and production-hardening ready.
- Current implementation already supports practical ID verification operations.
- Roadmap focuses on reliability, compliance, and scale.
