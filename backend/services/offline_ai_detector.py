"""
Offline AI-Generated Image Detector
Fallback detector when Gemini API is unavailable
Uses heuristic-based analysis without external API calls
"""

import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS
import cv2
from typing import Dict, Any
import os


class OfflineAIDetector:
    """
    Detects AI-generated images using local heuristics:
    - EXIF metadata analysis
    - Frequency domain patterns (DCT analysis)
    - Color histogram anomalies
    - Noise pattern analysis
    - JPEG artifact patterns
    """
    
    def __init__(self):
        self.ai_indicators = {
            'no_exif': 15,  # Missing EXIF data
            'suspicious_software': 25,  # Known AI generator in metadata
            'unusual_dct': 20,  # Unusual DCT patterns
            'flat_histogram': 15,  # Too uniform color distribution
            'noise_pattern': 25,  # Artificial noise patterns
            'lack_artifacts': 20,  # Missing natural JPEG artifacts
        }
        
        self.ai_software_keywords = [
            'midjourney', 'dall-e', 'dalle', 'stable diffusion', 
            'ai', 'generated', 'synthetic', 'deepfake', 'gan',
            'diffusion', 'neural', 'automatic1111', 'invoke'
        ]
    
    def detect(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze image for AI generation indicators
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dict with detection results
        """
        try:
            # Load image
            pil_image = Image.open(image_path)
            
            # Run all detection methods
            exif_score = self._check_exif_metadata(pil_image)
            freq_score = self._analyze_frequency_domain(image_path)
            histogram_score = self._analyze_histogram(pil_image)
            noise_score = self._analyze_noise_patterns(image_path)
            artifact_score = self._check_jpeg_artifacts(pil_image)
            
            # Calculate total score
            total_score = (
                exif_score + 
                freq_score + 
                histogram_score + 
                noise_score + 
                artifact_score
            )
            
            # Determine if AI-generated (threshold: 40+ points = likely AI)
            is_ai_generated = total_score >= 40
            confidence_score = min(100, int((total_score / 120) * 100))
            
            # Generate explanation
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
        """Check EXIF data for AI indicators"""
        score = 0
        
        try:
            exif_data = image._getexif()
            
            if exif_data is None:
                # No EXIF data - suspicious for modern cameras
                score += 15
            else:
                # Check for AI software in metadata
                for tag_id, value in exif_data.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if isinstance(value, str):
                        value_lower = value.lower()
                        if any(keyword in value_lower for keyword in self.ai_software_keywords):
                            score += 25
                            break
                        
                # Check for missing camera info
                has_camera = any(tag in exif_data for tag in [271, 272])  # Make, Model
                if not has_camera:
                    score += 10
                    
        except (AttributeError, KeyError, TypeError):
            # Error reading EXIF = likely no EXIF
            score += 10
            
        return min(score, 25)
    
    def _analyze_frequency_domain(self, image_path: str) -> int:
        """Analyze DCT patterns - AI images have distinct frequency signatures"""
        score = 0
        
        try:
            # Load grayscale
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return 0
                
            # Resize for consistent analysis
            img = cv2.resize(img, (512, 512))
            
            # DCT transform
            img_float = np.float32(img)
            dct = cv2.dct(img_float)
            
            # Analyze high-frequency components
            high_freq = dct[256:, 256:]
            high_freq_energy = np.sum(np.abs(high_freq))
            
            # Analyze low-frequency components
            low_freq = dct[:128, :128]
            low_freq_energy = np.sum(np.abs(low_freq))
            
            # AI images often have unusual frequency distributions
            freq_ratio = high_freq_energy / (low_freq_energy + 1e-10)
            
            # Too low ratio = suspiciously smooth (AI characteristic)
            if freq_ratio < 0.01:
                score += 20
            elif freq_ratio < 0.05:
                score += 10
                
        except Exception:
            pass
            
        return min(score, 20)
    
    def _analyze_histogram(self, image: Image.Image) -> int:
        """Analyze color distribution - AI images can have unnatural distributions"""
        score = 0
        
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            # Get histograms
            img_array = np.array(image)
            
            # Calculate histogram entropy for each channel
            entropies = []
            for channel in range(3):
                hist, _ = np.histogram(img_array[:, :, channel], bins=256, range=(0, 256))
                hist = hist / (hist.sum() + 1e-10)
                hist = hist[hist > 0]
                entropy = -np.sum(hist * np.log2(hist))
                entropies.append(entropy)
            
            avg_entropy = np.mean(entropies)
            
            # AI images often have too uniform distribution (high entropy)
            if avg_entropy > 7.5:
                score += 15
            elif avg_entropy > 7.0:
                score += 8
                
            # Check for unnatural uniformity
            std_entropy = np.std(entropies)
            if std_entropy < 0.1:  # All channels too similar
                score += 5
                
        except Exception:
            pass
            
        return min(score, 15)
    
    def _analyze_noise_patterns(self, image_path: str) -> int:
        """Analyze noise - AI images have different noise characteristics"""
        score = 0
        
        try:
            img = cv2.imread(image_path)
            if img is None:
                return 0
                
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply high-pass filter to extract noise
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            noise = cv2.subtract(gray, blur)
            
            # Calculate noise statistics
            noise_std = np.std(noise)
            noise_mean = np.mean(np.abs(noise))
            
            # AI images often have very low noise or very uniform noise
            if noise_std < 2.0:  # Too little noise
                score += 15
            elif noise_std > 20.0:  # Too much noise
                score += 10
                
            # Check noise uniformity across image
            h, w = noise.shape
            quarters = [
                noise[:h//2, :w//2],
                noise[:h//2, w//2:],
                noise[h//2:, :w//2],
                noise[h//2:, w//2:]
            ]
            quarter_stds = [np.std(q) for q in quarters]
            std_variation = np.std(quarter_stds)
            
            if std_variation < 0.5:  # Too uniform
                score += 10
                
        except Exception:
            pass
            
        return min(score, 25)
    
    def _check_jpeg_artifacts(self, image: Image.Image) -> int:
        """Check for natural JPEG artifacts - AI images often lack these"""
        score = 0
        
        try:
            # Check file format
            if image.format == 'PNG':
                # PNG from AI generator is suspicious
                score += 10
            elif image.format != 'JPEG':
                score += 5
                
            # Convert to array
            img_array = np.array(image)
            
            # Look for 8x8 block patterns typical of JPEG
            if img_array.shape[0] >= 16 and img_array.shape[1] >= 16:
                # Sample small region
                sample = img_array[:16, :16, 0] if len(img_array.shape) == 3 else img_array[:16, :16]
                
                # Calculate variance in 8x8 blocks
                block_vars = []
                for i in range(0, 8, 8):
                    for j in range(0, 8, 8):
                        block = sample[i:i+8, j:j+8]
                        block_vars.append(np.var(block))
                        
                avg_block_var = np.mean(block_vars)
                
                # Too smooth = missing JPEG artifacts
                if avg_block_var < 5.0:
                    score += 15
                elif avg_block_var < 15.0:
                    score += 8
                    
        except Exception:
            pass
            
        return min(score, 20)
    
    def _generate_explanation(self, exif: int, freq: int, hist: int, 
                             noise: int, artifact: int, total: int) -> str:
        """Generate human-readable explanation"""
        
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


# Singleton instance
_detector_instance = None

def get_offline_detector() -> OfflineAIDetector:
    """Get singleton instance of offline detector"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = OfflineAIDetector()
    return _detector_instance
