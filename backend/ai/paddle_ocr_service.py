\
\
\
   

import os
from typing import Dict, Any, List, Tuple
import tempfile

import cv2
import numpy as np


class PaddleOCRService:
                                          

    def __init__(self, use_angle_cls: bool = True, lang: str = "en"):
                                                                         
                                                                
        paddle_home = os.path.abspath(os.getenv("PADDLE_HOME", "data/paddle_home"))
        os.makedirs(paddle_home, exist_ok=True)
        os.makedirs(os.path.join(paddle_home, ".cache"), exist_ok=True)
        os.environ["PADDLE_HOME"] = paddle_home
        os.environ.setdefault("XDG_CACHE_HOME", os.path.join(paddle_home, ".cache"))
                                                                              
        os.environ.setdefault("FLAGS_use_mkldnn", "0")
        os.environ.setdefault("FLAGS_enable_pir_api", "0")
        os.environ.setdefault("FLAGS_enable_pir_in_executor", "0")

        self.ocr = None
        self.rapid_ocr = None
        self.engine = "unavailable"

        try:
            from paddleocr import PaddleOCR
            ocr_kwargs = {
                "use_angle_cls": use_angle_cls,
                "lang": lang,
                "use_gpu": False,
                "show_log": False,
                "enable_mkldnn": False,
            }
            try:
                self.ocr = PaddleOCR(**ocr_kwargs)
            except TypeError:
                                                                              
                ocr_kwargs.pop("enable_mkldnn", None)
                try:
                    self.ocr = PaddleOCR(**ocr_kwargs)
                except TypeError:
                    self.ocr = PaddleOCR(lang=lang)
            self.engine = "paddleocr"
        except Exception:
                                                                
            try:
                from rapidocr_onnxruntime import RapidOCR
                self.rapid_ocr = RapidOCR()
                self.engine = "rapidocr"
            except Exception:
                self.engine = "unavailable"

    def preprocess_image(self, image_path: str) -> np.ndarray:
                                                      
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray)
        thresh = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2,
        )

        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            angle = -(90 + angle) if angle < -45 else -angle

            if abs(angle) > 0.5:
                h, w = thresh.shape
                center = (w // 2, h // 2)
                matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                thresh = cv2.warpAffine(
                    thresh,
                    matrix,
                    (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE,
                )

        return thresh

    def _build_ocr_variants(self, image: np.ndarray) -> List[Tuple[str, np.ndarray]]:
                                                                               
        variants: List[Tuple[str, np.ndarray]] = [("original", image)]

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        denoised = cv2.fastNlMeansDenoising(gray)

        adaptive = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2,
        )
        variants.append(("adaptive", adaptive))

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(denoised)
        _, otsu = cv2.threshold(clahe, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        variants.append(("clahe_otsu", otsu))

        upscaled = cv2.resize(adaptive, None, fx=1.6, fy=1.6, interpolation=cv2.INTER_CUBIC)
        variants.append(("adaptive_upscaled", upscaled))

        return variants

    def _run_ocr_with_engine(self, image: np.ndarray) -> List[Tuple[Any, str, float]]:
\
\
\
           
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                temp_file_path = tmp.name
            cv2.imwrite(temp_file_path, image)

            if self.engine == "paddleocr":
                try:
                    result = self.ocr.ocr(temp_file_path, cls=True)
                except TypeError:
                                                                                   
                                                                   
                    result = self.ocr.ocr(temp_file_path)
                if not result or not result[0]:
                    return []
                lines: List[Tuple[Any, str, float]] = []
                for line in result[0]:
                    bbox, (text, confidence) = line
                    lines.append((bbox, str(text), float(confidence)))
                return lines

            if self.engine == "rapidocr":
                result, _ = self.rapid_ocr(temp_file_path)
                if not result:
                    return []
                lines = []
                for line in result:
                    if not isinstance(line, (list, tuple)) or len(line) < 3:
                        continue
                    bbox, text, confidence = line[0], line[1], line[2]
                    lines.append((bbox, str(text), float(confidence)))
                return lines

            return []
        finally:
            if temp_file_path:
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass

    def extract_text(self, image_path: str, preprocess: bool = True) -> Dict[str, Any]:
                                                      
        try:
            if self.engine == "unavailable":
                return {
                    "success": False,
                    "error": "No OCR engine available (PaddleOCR and RapidOCR unavailable)",
                    "raw_text": "",
                    "method": "none",
                }

            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")

            variants = self._build_ocr_variants(image) if preprocess else [("original", image)]
            merged_lines: Dict[str, Dict[str, Any]] = {}
            best_variant = "original"
            best_score = -1.0

            for variant_name, variant_img in variants:
                lines = self._run_ocr_with_engine(variant_img)
                if not lines:
                    continue

                line_count = 0
                conf_sum = 0.0
                for bbox, text, confidence in lines:
                    clean_text = str(text or "").strip()
                    if not clean_text:
                        continue

                    key = " ".join(clean_text.split()).lower()
                    line_count += 1
                    conf_sum += float(confidence)

                    prev = merged_lines.get(key)
                    if prev is None or float(confidence) > prev["confidence"]:
                        merged_lines[key] = {
                            "text": clean_text,
                            "confidence": float(confidence),
                            "bbox": bbox,
                            "variant": variant_name,
                        }

                score = conf_sum + (0.15 * line_count)
                if score > best_score:
                    best_score = score
                    best_variant = variant_name

            if not merged_lines:
                return {
                    "success": False,
                    "error": "No text detected",
                    "raw_text": "",
                    "method": self.engine,
                }

            sorted_lines = sorted(merged_lines.values(), key=lambda x: x["confidence"], reverse=True)
            texts = [line["text"] for line in sorted_lines]
            confidences = [float(line["confidence"]) for line in sorted_lines]
            bounding_boxes = [line["bbox"] for line in sorted_lines]

            return {
                "success": True,
                "raw_text": " ".join(texts),
                "structured_text": texts,
                "confidence_scores": confidences,
                "bounding_boxes": bounding_boxes,
                "average_confidence": float(np.mean(confidences)) if confidences else 0.0,
                "method": self.engine,
                "best_variant": best_variant,
                "variants_tried": [name for name, _ in variants],
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_text": "",
                "method": "paddleocr",
            }


_paddle_service = None


def get_paddle_service() -> PaddleOCRService:
                                                   
    global _paddle_service
    if _paddle_service is None:
        _paddle_service = PaddleOCRService()
    return _paddle_service
