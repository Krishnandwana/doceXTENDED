\
\
\
   

import re
from typing import Any, Dict, List, Optional


class NameIDExtractor:
    RE_AADHAAR = re.compile(r"\b(\d{4}\s?\d{4}\s?\d{4})\b", re.IGNORECASE)
    RE_PAN = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", re.IGNORECASE)
    RE_PASSPORT = re.compile(r"\b([A-PR-WY][0-9]{7})\b", re.IGNORECASE)
    RE_VOTER = re.compile(r"\b([A-Z]{3}[0-9]{7})\b", re.IGNORECASE)
    RE_DL = re.compile(r"\b([A-Z]{2}[0-9]{2}\s?[0-9]{11})\b", re.IGNORECASE)
    RE_DOB = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b")

    NAME_LABEL_RE = re.compile(r"\bname\b[:\s]*([A-Za-z][A-Za-z\s]{1,48})$", re.IGNORECASE)
    FATHER_LABEL_RE = re.compile(r"\b(father|s\/o|d\/o|son of|daughter of)\b", re.IGNORECASE)

    NAME_BLOCK_TOKENS = {
        "permanent", "account", "number", "income", "tax", "department",
        "government", "india", "republic", "election", "commission",
        "card", "signature", "photo", "dob", "date", "birth", "sex", "male", "female"
    }

    def extract(
        self,
        raw_text: str,
        document_type: str = "unknown",
        structured_lines: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        text = (raw_text or "").strip()
        lines = self._normalize_lines(structured_lines if structured_lines else text.splitlines())
        if not text and not lines:
            return {"success": False, "error": "Empty OCR text", "fields": {}}

        id_number = self._extract_id(text, document_type)
        dob = self._extract_dob(text)
        name = self._extract_name(lines, document_type, id_number)

        confidence = 0.0
        confidence += 0.50 if name else 0.0
        confidence += 0.20 if dob else 0.0
        confidence += 0.30 if id_number else 0.0

        return {
            "success": True,
            "fields": {
                "name": name,
                "date_of_birth": dob,
                "id_number": id_number,
                "document_type": document_type,
            },
            "confidence": float(confidence),
        }

    def _extract_id(self, text: str, doc_type: str) -> Optional[str]:
        lowered = doc_type.lower()
        if lowered == "aadhaar":
            m = self.RE_AADHAAR.search(text)
        elif lowered == "pan":
            m = self.RE_PAN.search(text)
        elif lowered == "passport":
            m = self.RE_PASSPORT.search(text)
        elif lowered == "voter_id":
            m = self.RE_VOTER.search(text)
        elif lowered == "driving_license":
            m = self.RE_DL.search(text)
        else:
            for pat in [self.RE_PAN, self.RE_AADHAAR, self.RE_PASSPORT, self.RE_VOTER, self.RE_DL]:
                m = pat.search(text)
                if m:
                    return self._clean_id(m.group(1))
            return None
        return self._clean_id(m.group(1)) if m else None

    def _extract_dob(self, text: str) -> Optional[str]:
        m = self.RE_DOB.search(text)
        return m.group(1) if m else None

    def _extract_name(self, lines: List[str], doc_type: str, id_number: Optional[str]) -> Optional[str]:
        if not lines:
            return None

                                                               
        for line in lines:
            m = self.NAME_LABEL_RE.search(line)
            if m:
                cand = self._normalize_name(m.group(1))
                if self._is_valid_name_candidate(cand):
                    return cand

                                                                                    
        if doc_type.lower() == "pan":
            pan_name = self._extract_pan_name(lines, id_number)
            if pan_name:
                return pan_name

                                         
        scored: List[tuple[float, str]] = []
        for i, line in enumerate(lines):
            cand = self._normalize_name(line)
            score = self._score_name_candidate(cand, line)
            if score > 0:
                scored.append((score, cand))
        if not scored:
            return None
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1]

    def _extract_pan_name(self, lines: List[str], pan_number: Optional[str]) -> Optional[str]:
        pan_idx = -1
        if pan_number:
            pan_upper = pan_number.upper()
            for i, ln in enumerate(lines):
                if pan_upper in ln.upper():
                    pan_idx = i
                    break

        scored: List[tuple[float, str]] = []
        for i, line in enumerate(lines):
            cand = self._normalize_name(line)
            if not self._is_valid_name_candidate(cand):
                continue
            if self.FATHER_LABEL_RE.search(line):
                continue

            base = self._score_name_candidate(cand, line)
            if base <= 0:
                continue

                                                                               
            proximity = 0.0
            if pan_idx >= 0:
                proximity = max(0.0, 0.5 - 0.12 * abs(i - pan_idx))
            score = base + proximity
            scored.append((score, cand))

        if not scored:
            return None
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1]

    def _score_name_candidate(self, cleaned: str, raw_line: str) -> float:
        if not cleaned:
            return -1.0
        if not self._is_valid_name_candidate(cleaned):
            return -1.0

        words = cleaned.split()
        score = 0.5
        score += 0.2 if 2 <= len(words) <= 3 else 0.0
        score += 0.1 if all(2 <= len(w) <= 14 for w in words) else 0.0
        score += 0.1 if not self.FATHER_LABEL_RE.search(raw_line) else -0.2
        score += 0.1 if raw_line.isupper() else 0.0
        return score

    def _is_valid_name_candidate(self, cleaned: str) -> bool:
        if not cleaned:
            return False
        if any(ch.isdigit() for ch in cleaned):
            return False

        words = cleaned.split()
        if len(words) < 2 or len(words) > 4:
            return False
        if any(len(w) < 2 or len(w) > 18 for w in words):
            return False

        low_words = {w.lower() for w in words}
        if low_words & self.NAME_BLOCK_TOKENS:
            return False
                                              
        joined = " ".join(low_words)
        if "department" in joined or "account number" in joined:
            return False
        return True

    @staticmethod
    def _normalize_lines(lines: List[str]) -> List[str]:
        out: List[str] = []
        for line in lines:
            if not line:
                continue
            s = str(line).strip()
            if not s:
                continue
            out.append(s)
        return out

    @staticmethod
    def _normalize_name(value: str) -> str:
        cleaned = re.sub(r"[^A-Za-z\s]", " ", value or "")
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if not cleaned:
            return ""
        return cleaned.title()

    @staticmethod
    def _clean_id(value: str) -> str:
        return re.sub(r"[^A-Za-z0-9]", "", value).upper()


_extractor = None


def get_name_id_extractor() -> NameIDExtractor:
    global _extractor
    if _extractor is None:
        _extractor = NameIDExtractor()
    return _extractor
