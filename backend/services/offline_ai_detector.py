import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS
import cv2
from typing import Dict, Any
import os


class OfflineAIDetector:
    def __init__(self):
        self.ai_indicators = {
            'no_exif': 15,
            'suspicious_software': 25,
            'unusual_dct': 20,
            'flat_histogram': 15,
            'noise_pattern': 25,
            'lack_artifacts': 20,
        }
        
        self.ai_software_keywords = [
            'midjourney', 'dall-e', 'dalle', 'stable diffusion', 
            'ai', 'generated', 'synthetic', 'deepfake', 'gan',
            'diffusion', 'neural', 'automatic1111', 'invoke'
        ]
    
    def detect(self, image_path: str) -> Dict[str, Any]:
        try:
            pil_image = Image.open(image_path)
            exif_score = self._check_exif_metadata(pil_image)
            freq_score = self._analyze_frequency_domain(image_path)
            histogram_score = self._analyze_histogram(pil_image)
            noise_score = self._analyze_noise_patterns(image_path)
            artifact_score = self._check_jpeg_artifacts(pil_image)

            total_score = (
                exif_score + 
                freq_score + 
                histogram_score + 
                noise_score + 
                artifact_score
            )

            is_ai_generated = total_score >= 40
            confidence_score = min(100, int((total_score / 120) * 100))

            explanation = self._generate_explanation(
                exif_score, freq_score, histogram_score, 
                noise_score, artifact_score, total_score
            )
            
            return {
                'success': True,
                'authenticity': {
                    'is_ai_generated': is_ai_generated,
                    'confidence_score': confidence_score,
                    'explanation': explanation,
                    'detection_method': 'offline_heuristic',
                    'scores': {
                        'exif': exif_score,
                        'frequency': freq_score,
                        'histogram': histogram_score,
                        'noise': noise_score,
                        'artifacts': artifact_score,
                        'total': total_score
                    }
                },
                'method': 'offline'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Offline detection failed: {str(e)}",
                'method': 'offline'
            }
    
    def _check_exif_metadata(self, image: Image.Image) -> int:
        score = 0
        
        try:
            exif_data = image._getexif()
            
            if exif_data is None:
                score += 15
            else:
                for tag_id, value in exif_data.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if isinstance(value, str):
                        value_lower = value.lower()
                        if any(keyword in value_lower for keyword in self.ai_software_keywords):
                            score += 25
                            break

                has_camera = any(tag in exif_data for tag in [271, 272])               
                if not has_camera:
                    score += 10
                    
        except (AttributeError, KeyError, TypeError):
            score += 10
            
        return min(score, 25)
    
    def _analyze_frequency_domain(self, image_path: str) -> int:
        score = 0
        
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return 0

            img = cv2.resize(img, (512, 512))

            img_float = np.float32(img)
            dct = cv2.dct(img_float)

            high_freq = dct[256:, 256:]
            high_freq_energy = np.sum(np.abs(high_freq))

            low_freq = dct[:128, :128]
            low_freq_energy = np.sum(np.abs(low_freq))

            freq_ratio = high_freq_energy / (low_freq_energy + 1e-10)

            if freq_ratio < 0.01:
                score += 20
            elif freq_ratio < 0.05:
                score += 10
                
        except Exception:
            pass
            
        return min(score, 20)
    
    def _analyze_histogram(self, image: Image.Image) -> int:
        score = 0
        
        try:
            if image.mode != 'RGB':
                image = image.convert('RGB')

            img_array = np.array(image)

            entropies = []
            for channel in range(3):
                hist, _ = np.histogram(img_array[:, :, channel], bins=256, range=(0, 256))
                hist = hist / (hist.sum() + 1e-10)
                hist = hist[hist > 0]
                entropy = -np.sum(hist * np.log2(hist))
                entropies.append(entropy)
            
            avg_entropy = np.mean(entropies)

            if avg_entropy > 7.5:
                score += 15
            elif avg_entropy > 7.0:
                score += 8

            std_entropy = np.std(entropies)
            if std_entropy < 0.1:
                score += 5
                
        except Exception:
            pass
            
        return min(score, 15)
    
    def _analyze_noise_patterns(self, image_path: str) -> int:
        score = 0
        
        try:
            img = cv2.imread(image_path)
            if img is None:
                return 0

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            noise = cv2.subtract(gray, blur)

            noise_std = np.std(noise)
            noise_mean = np.mean(np.abs(noise))

            if noise_std < 2.0:
                score += 15
            elif noise_std > 20.0:
                score += 10

            h, w = noise.shape
            quarters = [
                noise[:h//2, :w//2],
                noise[:h//2, w//2:],
                noise[h//2:, :w//2],
                noise[h//2:, w//2:]
            ]
            quarter_stds = [np.std(q) for q in quarters]
            std_variation = np.std(quarter_stds)

            if std_variation < 0.5:
                score += 10
                
        except Exception:
            pass
            
        return min(score, 25)
    
    def _check_jpeg_artifacts(self, image: Image.Image) -> int:
        score = 0
        
        try:
            if image.format == 'PNG':
                score += 10
            elif image.format != 'JPEG':
                score += 5

            img_array = np.array(image)

            if img_array.shape[0] >= 16 and img_array.shape[1] >= 16:
                sample = img_array[:16, :16, 0] if len(img_array.shape) == 3 else img_array[:16, :16]

                block_vars = []
                for i in range(0, 8, 8):
                    for j in range(0, 8, 8):
                        block = sample[i:i+8, j:j+8]
                        block_vars.append(np.var(block))

                avg_block_var = np.mean(block_vars)

                if avg_block_var < 5.0:
                    score += 15
                elif avg_block_var < 15.0:
                    score += 8
                    
        except Exception:
            pass
            
        return min(score, 20)
    
    def _generate_explanation(self, exif: int, freq: int, hist: int,
                             noise: int, artifact: int, total: int) -> str:
        findings = []
        
        if exif >= 15:
            findings.append("missing or suspicious EXIF metadata")
        if freq >= 10:
            findings.append("unusual frequency domain patterns")
        if hist >= 10:
            findings.append("unnatural color distribution")
        if noise >= 15:
            findings.append("artificial noise characteristics")
        if artifact >= 15:
            findings.append("lack of natural JPEG compression artifacts")
        
        if total >= 60:
            confidence = "High"
            verdict = "This image strongly shows characteristics of AI generation"
        elif total >= 40:
            confidence = "Medium"
            verdict = "This image shows multiple indicators of possible AI generation"
        elif total >= 20:
            confidence = "Low"
            verdict = "This image shows some suspicious characteristics"
        else:
            confidence = "Very Low"
            verdict = "This image appears to be authentic with natural characteristics"
        
        if findings:
            details = ", ".join(findings)
            explanation = f"{verdict}. {confidence} confidence based on: {details}. (Offline analysis)"
        else:
            explanation = f"{verdict}. (Offline analysis)"
        
        return explanation


_detector_instance = None

def get_offline_detector() -> OfflineAIDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = OfflineAIDetector()
    return _detector_instance
