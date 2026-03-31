\
\
\
   

import re
from typing import Any, Dict, List


class DocumentClassifier:
    DOC_PATTERNS = {
        "aadhaar": [
            re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b", re.IGNORECASE),
            re.compile(r"\baadhaar\b", re.IGNORECASE),
            re.compile(r"\buidai\b", re.IGNORECASE),
        ],
        "pan": [
            re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", re.IGNORECASE),
            re.compile(r"\bpermanent account number\b", re.IGNORECASE),
            re.compile(r"\bincome tax department\b", re.IGNORECASE),
        ],
        "passport": [
            re.compile(r"\bpassport\b", re.IGNORECASE),
            re.compile(r"\brepublic of india\b", re.IGNORECASE),
            re.compile(r"\b[A-PR-WY][0-9]{7}\b", re.IGNORECASE),
        ],
        "driving_license": [
            re.compile(r"\bdriving licence\b|\bdriving license\b", re.IGNORECASE),
            re.compile(r"\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b", re.IGNORECASE),
        ],
        "voter_id": [
            re.compile(r"\belection commission\b", re.IGNORECASE),
            re.compile(r"\bepic\b", re.IGNORECASE),
            re.compile(r"\b[A-Z]{3}[0-9]{7}\b", re.IGNORECASE),
        ],
    }

    def classify(self, raw_text: str) -> Dict[str, Any]:
        text = (raw_text or "").strip()
        if not text:
            return {
                "success": False,
                "document_type": "unknown",
                "confidence": 0.0,
                "scores": {},
                "error": "Empty OCR text",
            }

        scores: Dict[str, float] = {}
        for doc_type, patterns in self.DOC_PATTERNS.items():
            hits = sum(1 for p in patterns if p.search(text))
            scores[doc_type] = hits / max(len(patterns), 1)

        best_type = max(scores, key=scores.get)
        best_score = float(scores[best_type])

        return {
            "success": True,
            "document_type": best_type if best_score > 0 else "unknown",
            "confidence": best_score,
            "scores": scores,
            "top_candidates": self._rank_scores(scores),
        }

    @staticmethod
    def _rank_scores(scores: Dict[str, float]) -> List[Dict[str, Any]]:
        ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
        return [{"document_type": k, "score": float(v)} for k, v in ordered]


_doc_classifier = None


def get_document_classifier() -> DocumentClassifier:
    global _doc_classifier
    if _doc_classifier is None:
        _doc_classifier = DocumentClassifier()
    return _doc_classifier

