# ML/AI Overview

## Objective

Provide reliable ID verification signals with a focus on face matching between:

- face present in an identity document
- face captured from a selfie

## Model Positioning

DocVerify uses its own face verification model pipeline for ID-to-selfie matching.

This model pipeline is a core part of our fintech API offering and is designed for explainable confidence outputs in onboarding flows.

## Pipeline Components

1. Image quality checks
2. Face region extraction from ID
3. Selfie face capture/normalization
4. Face similarity scoring
5. Decision thresholding and confidence

## Additional AI Components

- OCR extraction via PaddleOCR
- Rule-based document field validation
- Offline authenticity heuristics

## ML Roadmap

1. Improve robustness for low-light and blur.
2. Expand anti-spoof and liveness capabilities.
3. Calibrate thresholds by use case risk levels.
4. Add evaluation datasets and regression benchmarks.
