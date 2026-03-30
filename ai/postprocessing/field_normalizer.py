"""
Normalize and standardize extracted field values.
"""

import re
from typing import Any, Dict


def normalize_document_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(fields or {})
    if "name" in normalized and normalized["name"]:
        normalized["name"] = _normalize_name(str(normalized["name"]))
    if "date_of_birth" in normalized and normalized["date_of_birth"]:
        normalized["date_of_birth"] = _normalize_date(str(normalized["date_of_birth"]))
    if "id_number" in normalized and normalized["id_number"]:
        normalized["id_number"] = _normalize_id(str(normalized["id_number"]))
    return normalized


def _normalize_name(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z\s]", "", name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.title()


def _normalize_date(value: str) -> str:
    value = value.replace(".", "/").replace("-", "/")
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", value)
    if not m:
        return value
    dd, mm, yyyy = m.groups()
    return f"{yyyy}-{mm}-{dd}"


def _normalize_id(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", value).upper()

