\
\
\
   

import base64
import json
import os
from typing import Any, Dict, List
from urllib import error, request

import cv2


class SecondryOCRService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_OCR_MODEL", "gemini-1.5-flash")
        self.timeout = int(os.getenv("GEMINI_OCR_TIMEOUT_SEC", "25"))
        self.available = bool(self.api_key)

    def extract_text(self, image_path: str) -> Dict[str, Any]:
        if not self.available:
            return {
                "success": False,
                "error": "GEMINI_API_KEY not configured",
                "raw_text": "",
                "structured_text": [],
                "method": "gemini",
            }

        image = cv2.imread(image_path)
        if image is None:
            return {
                "success": False,
                "error": f"Could not read image: {image_path}",
                "raw_text": "",
                "structured_text": [],
                "method": "gemini",
            }

        ok, encoded = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        if not ok:
            return {
                "success": False,
                "error": "Failed to encode image",
                "raw_text": "",
                "structured_text": [],
                "method": "gemini",
            }

        image_b64 = base64.b64encode(encoded.tobytes()).decode("utf-8")
        prompt = (
            "Extract all visible text from this document image. "
            "Return plain text only, preserve line breaks, no markdown, no explanation."
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}},
                    ]
                }
            ]
        }

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )

        try:
            req = request.Request(
                url=url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8")
            parsed = json.loads(body)

            texts: List[str] = []
            for candidate in parsed.get("candidates", []) or []:
                content = candidate.get("content", {}) or {}
                parts = content.get("parts", []) or []
                for part in parts:
                    t = str(part.get("text", "")).strip()
                    if t:
                        texts.append(t)

            raw_text = "\n".join([t for t in texts if t]).strip()
            if not raw_text:
                return {
                    "success": False,
                    "error": "No text returned by Gemini OCR",
                    "raw_text": "",
                    "structured_text": [],
                    "method": "gemini",
                }

            lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
            return {
                "success": True,
                "raw_text": raw_text,
                "structured_text": lines,
                "average_confidence": None,
                "method": "gemini",
            }
        except error.HTTPError as e:
            try:
                details = e.read().decode("utf-8")
            except Exception:
                details = str(e)
            return {
                "success": False,
                "error": f"Gemini HTTP error: {e.code} {details}",
                "raw_text": "",
                "structured_text": [],
                "method": "gemini",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Gemini OCR failed: {str(e)}",
                "raw_text": "",
                "structured_text": [],
                "method": "gemini",
            }


_secondry_ocr_service = None


def get_secondry_ocr_service() -> SecondryOCRService:
    global _secondry_ocr_service
    if _secondry_ocr_service is None:
        _secondry_ocr_service = SecondryOCRService()
    return _secondry_ocr_service
