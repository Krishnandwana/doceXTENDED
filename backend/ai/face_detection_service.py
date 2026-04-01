import base64
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
import torch
from PIL import Image
try:
    from facenet_pytorch import InceptionResnetV1, MTCNN
except Exception:
    InceptionResnetV1 = None                            
    MTCNN = None                            


class FaceDetectionService:
    def __init__(self):
        self.facenet_available = InceptionResnetV1 is not None and MTCNN is not None
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.mtcnn = None
        self.resnet = None
        if self.facenet_available:
            try:
                self.mtcnn = MTCNN(
                    image_size=160,
                    margin=14,
                    min_face_size=40,
                    thresholds=[0.6, 0.7, 0.7],
                    factor=0.709,
                    post_process=True,
                    keep_all=True,
                    device=self.device
                )
                self.resnet = InceptionResnetV1(pretrained="vggface2").eval().to(self.device)
            except Exception:
                                                                                    
                self.mtcnn = None
                self.resnet = None
                self.facenet_available = False

        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    def _load_rgb_image(self, image_path: str) -> np.ndarray:
        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            raise ValueError(f"Could not read image: {image_path}")
        return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    def _detect_and_align_faces(
        self,
        image_rgb: np.ndarray
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        if self.mtcnn is None:
            raise ValueError("FaceNet is not available. Install facenet-pytorch and torch.")
        pil_image = Image.fromarray(image_rgb)
        boxes, probs = self.mtcnn.detect(pil_image)
        aligned = self.mtcnn(pil_image)
        return boxes, aligned

    def _embed_faces(self, aligned_faces: torch.Tensor) -> np.ndarray:
        if self.resnet is None:
            raise ValueError("FaceNet is not available. Install facenet-pytorch and torch.")
        with torch.no_grad():
            embeddings = self.resnet(aligned_faces.to(self.device))
        return embeddings.detach().cpu().numpy()

    def _get_primary_embedding(self, image_path: str) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
        image_rgb = self._load_rgb_image(image_path)
        boxes, aligned = self._detect_and_align_faces(image_rgb)

        if boxes is None or len(boxes) == 0 or aligned is None or len(aligned) == 0:
            raise ValueError("No face detected in image")

        embeddings = self._embed_faces(aligned)
        x1, y1, x2, y2 = boxes[0]
        face_location = (int(y1), int(x2), int(y2), int(x1))                            
        return embeddings[0], face_location

    def detect_faces(self, image_path: str) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
           
        try:
            if not self.facenet_available:
                return self._detect_faces_haar(image_path)

            image_rgb = self._load_rgb_image(image_path)
            boxes, aligned = self._detect_and_align_faces(image_rgb)

            if boxes is None or len(boxes) == 0 or aligned is None or len(aligned) == 0:
                return {
                    'success': False,
                    'error': 'No face detected in image',
                    'face_count': 0
                }

            embeddings = self._embed_faces(aligned)
            face_locations = []
            for box in boxes:
                x1, y1, x2, y2 = box
                face_locations.append((int(y1), int(x2), int(y2), int(x1)))

            return {
                'success': True,
                'face_count': len(embeddings),
                'face_locations': face_locations,
                'face_encodings': embeddings.tolist(),
                'primary_face_encoding': embeddings[0].tolist()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'face_count': 0
            }

    def _detect_faces_haar(self, image_path: str) -> Dict[str, Any]:
        image = cv2.imread(image_path)
        if image is None:
            return {'success': False, 'error': f'Could not read image: {image_path}', 'face_count': 0}
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
        if len(faces) == 0:
            faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.03, minNeighbors=2, minSize=(15, 15))
        if len(faces) == 0:
            return {'success': False, 'error': 'No face detected in image', 'face_count': 0}
        face_locations = [(int(y), int(x + w), int(y + h), int(x)) for (x, y, w, h) in faces]
        return {
            'success': True,
            'face_count': int(len(faces)),
            'face_locations': face_locations,
            'face_encodings': [],
            'primary_face_encoding': None,
            'method': 'opencv_haar_fallback'
        }

    def analyze_face_quality(self, image_path: str) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
           
        try:
                        
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

                          
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                return {
                    'success': False,
                    'error': 'No face detected',
                    'is_good_quality': False
                }

                                
            x, y, w, h = faces[0]
            face_region = gray[y:y+h, x:x+w]

                                                   
            blur_score = cv2.Laplacian(face_region, cv2.CV_64F).var()

                              
            brightness = np.mean(face_region)

                                        
            min_face_size = 80
            face_size_ok = w >= min_face_size and h >= min_face_size

                                          
            is_good_quality = (
                blur_score > 100 and                  
                40 < brightness < 220 and                   
                face_size_ok                
            )

            return {
                'success': True,
                'is_good_quality': is_good_quality,
                'quality_metrics': {
                    'blur_score': float(blur_score),
                    'brightness': float(brightness),
                    'face_width': int(w),
                    'face_height': int(h),
                    'blur_acceptable': blur_score > 100,
                    'brightness_acceptable': 40 < brightness < 220,
                    'size_acceptable': face_size_ok
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'is_good_quality': False
            }

    def compare_faces(
        self,
        image1_path: str,
        image2_path: str,
        tolerance: float = 0.65
    ) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
\
\
           
        try:
            if not self.facenet_available:
                return self._compare_faces_haar(image1_path, image2_path, tolerance=tolerance)

            emb1, _ = self._get_primary_embedding(image1_path)
            emb2, _ = self._get_primary_embedding(image2_path)

            norm1 = float(np.linalg.norm(emb1))
            norm2 = float(np.linalg.norm(emb2))
            if norm1 == 0.0 or norm2 == 0.0:
                raise ValueError("Invalid zero-norm embedding")

            cosine_similarity = float(np.dot(emb1, emb2) / (norm1 * norm2))
            cosine_similarity = max(-1.0, min(1.0, cosine_similarity))
            face_distance = float(1.0 - cosine_similarity)
            similarity_percentage = float(((cosine_similarity + 1.0) / 2.0) * 100.0)

            threshold = tolerance if 0.0 <= tolerance <= 1.0 else 0.65
            is_match = cosine_similarity >= threshold

            return {
                'success': True,
                'is_match': bool(is_match),
                'face_distance': face_distance,
                'similarity_percentage': similarity_percentage,
                'confidence': 'high' if cosine_similarity >= 0.75 else 'medium' if cosine_similarity >= 0.65 else 'low',
                'cosine_similarity': cosine_similarity,
                'threshold': threshold
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _compare_faces_haar(
        self,
        image1_path: str,
        image2_path: str,
        tolerance: float = 0.65
    ) -> Dict[str, Any]:
        try:
            face1 = self._extract_primary_face_roi(image1_path)
            face2 = self._extract_primary_face_roi(image2_path)
            if face1 is None or face2 is None:
                return {'success': False, 'error': 'Could not detect face in one or both images'}

            hist1 = cv2.calcHist([face1], [0], None, [64], [0, 256])
            hist2 = cv2.calcHist([face2], [0], None, [64], [0, 256])
            cv2.normalize(hist1, hist1)
            cv2.normalize(hist2, hist2)
            corr = float(cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL))
            corr = max(-1.0, min(1.0, corr))
            similarity_percentage = float(((corr + 1.0) / 2.0) * 100.0)
            threshold = tolerance if 0.0 <= tolerance <= 1.0 else 0.65
            is_match = corr >= threshold
            return {
                'success': True,
                'is_match': bool(is_match),
                'face_distance': float(1.0 - corr),
                'similarity_percentage': similarity_percentage,
                'confidence': 'high' if corr >= 0.75 else 'medium' if corr >= 0.65 else 'low',
                'cosine_similarity': corr,
                'threshold': threshold,
                'method': 'opencv_haar_hist_fallback'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _extract_primary_face_roi(self, image_path: str) -> Optional[np.ndarray]:
        image = cv2.imread(image_path)
        if image is None:
            return None
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(20, 20))
        if len(faces) == 0:
            faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.03, minNeighbors=2, minSize=(15, 15))
        if len(faces) == 0:
            return None
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        x, y, w, h = faces[0]
        roi = gray[y:y+h, x:x+w]
        if roi.size == 0:
            return None
        return cv2.resize(roi, (160, 160), interpolation=cv2.INTER_CUBIC)

    def detect_liveness(self, image_path: str) -> Dict[str, Any]:
        try:
                        
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

                          
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5
            )

            if len(faces) == 0:
                return {
                    'success': False,
                    'error': 'No face detected',
                    'is_live': False
                }

                                   
            x, y, w, h = faces[0]
            face_region = gray[y:y+h, x:x+w]

                                                                
                                                                        
            texture_variance = np.var(face_region)

                                    
            edges = cv2.Canny(face_region, 50, 150)
            edge_density = np.sum(edges) / (w * h * 255)

            is_live = (
                texture_variance > 500 and                                
                edge_density > 0.02                               
            )

            return {
                'success': True,
                'is_live': is_live,
                'confidence': 'medium',
                'metrics': {
                    'texture_variance': float(texture_variance),
                    'edge_density': float(edge_density)
                },
                'note': 'Heuristic liveness check'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'is_live': False
            }

    def extract_face_image(self, image_path: str, output_path: str) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
\
           
        try:
            if not self.facenet_available:
                                                                                    
                extracted = self.extract_face_as_base64(image_path)
                if not extracted.get('success'):
                    return {'success': False, 'error': extracted.get('error', 'No face detected')}
                face_b64 = extracted.get('face_image_base64', '')
                if not face_b64:
                    return {'success': False, 'error': 'No face image available'}
                face_bytes = base64.b64decode(face_b64)
                with open(output_path, 'wb') as f:
                    f.write(face_bytes)
                return {
                    'success': True,
                    'face_path': output_path,
                    'face_location': extracted.get('face_location')
                }

            image_rgb = self._load_rgb_image(image_path)
            boxes, aligned = self._detect_and_align_faces(image_rgb)

            if boxes is None or len(boxes) == 0 or aligned is None or len(aligned) == 0:
                return {
                    'success': False,
                    'error': 'No face detected'
                }

            aligned_face = aligned[0].detach().cpu().numpy().transpose(1, 2, 0)
            aligned_face = ((aligned_face + 1.0) / 2.0 * 255.0).clip(0, 255).astype(np.uint8)
            face_bgr = cv2.cvtColor(aligned_face, cv2.COLOR_RGB2BGR)
            cv2.imwrite(output_path, face_bgr)

            x1, y1, x2, y2 = boxes[0]
            return {
                'success': True,
                'face_path': output_path,
                'face_location': {
                    'top': int(y1),
                    'right': int(x2),
                    'bottom': int(y2),
                    'left': int(x1)
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_face_as_base64(self, image_path: str) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
           
        import base64
        from io import BytesIO
        
        try:
                                     
            image = cv2.imread(image_path)
            if image is None:
                print(f"[Face] Could not load image: {image_path}")
                return {
                    'success': False,
                    'error': 'Could not load image'
                }
            
            print(f"[Face] Image loaded: {image.shape}")
            
                                                     
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
                                                                              
            faces = None
            
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.05,                  
                minNeighbors=3,                      
                minSize=(20, 20)                          
            )
            print(f"[Face] Strategy 1 found {len(faces)} faces")
            
            if len(faces) == 0:
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.03,
                    minNeighbors=2,
                    minSize=(15, 15)
                )
                print(f"[Face] Strategy 2 found {len(faces)} faces")

            if len(faces) == 0:
                print(f"[Face] No face detected after all strategies")
                return {
                    'success': False,
                    'error': 'No face detected in document'
                }
            
            print(f"[Face] Found {len(faces)} faces, using first one")
            
                                             
            if len(faces) > 1:
                                                        
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            
            (x, y, w, h) = faces[0]
            print(f"[Face] Face location: x={x}, y={y}, w={w}, h={h}")
            
                                                                                                   
                                                                                    
            padding_horizontal = int(w * 1.5)
            padding_vertical = int(h * 1.5)
            
            x_start = max(0, x - padding_horizontal)
            y_start = max(0, y - padding_vertical)
            x_end = min(image.shape[1], x + w + padding_horizontal)
            y_end = min(image.shape[0], y + h + padding_vertical)
            
                                 
            face_image = image[y_start:y_end, x_start:x_end]
            print(f"[Face] Extracted face size (before resize): {face_image.shape}")
            
                                                                         
            target_size = 224
            if face_image.shape[0] < target_size or face_image.shape[1] < target_size:
                                                                             
                scale = target_size / min(face_image.shape[0], face_image.shape[1])
                new_width = int(face_image.shape[1] * scale)
                new_height = int(face_image.shape[0] * scale)
                face_image = cv2.resize(face_image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                print(f"[Face] Resized face to: {face_image.shape}")
            
                                
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
                                  
            face_pil = Image.fromarray(face_rgb)
            
                                                 
            buffered = BytesIO()
            face_pil.save(buffered, format="JPEG", quality=95)
            face_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            print(f"[Face] Successfully converted to base64")

            return {
                'success': True,
                'face_image_base64': face_base64,
                'face_location': {
                    'top': y,
                    'right': x + w,
                    'bottom': y + h,
                    'left': x
                },
                'confidence': 0.85                                           
            }

        except Exception as e:
            print(f"[Face] Exception during extraction: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }

    def detect_document_boundary(self, image_path: str) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
           
        try:
            import base64
            from io import BytesIO
            
            print(f"[Document Crop] Processing image: {image_path}")
            
                        
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'success': False,
                    'error': f'Failed to read image: {image_path}'
                }
            
            original_height, original_width = image.shape[:2]
            print(f"[Document Crop] Original size: {original_width}x{original_height}")
            
                                          
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
                                                 
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
                            
            edges = cv2.Canny(blurred, 50, 150)
            
                                        
            kernel = np.ones((5, 5), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=2)
            
                           
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                print("[Document Crop] No contours found, using full image")
                return self._encode_image_to_base64(image)
            
                                      
            largest_contour = max(contours, key=cv2.contourArea)
            contour_area = cv2.contourArea(largest_contour)
            image_area = original_width * original_height
            
                                                                         
            if contour_area < image_area * 0.3:
                print(f"[Document Crop] Largest contour too small ({contour_area/image_area*100:.1f}%), using full image")
                return self._encode_image_to_base64(image)
            
                                            
            peri = cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, 0.02 * peri, True)
            
                                                                  
            if len(approx) == 4:
                print("[Document Crop] Found quadrilateral, applying perspective transform")
                cropped = self._four_point_transform(image, approx.reshape(4, 2))
            else:
                                                   
                print(f"[Document Crop] Using bounding rectangle (contour points: {len(approx)})")
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                                       
                margin_x = int(w * 0.02)
                margin_y = int(h * 0.02)
                
                x = max(0, x - margin_x)
                y = max(0, y - margin_y)
                w = min(original_width - x, w + 2 * margin_x)
                h = min(original_height - y, h + 2 * margin_y)
                
                cropped = image[y:y+h, x:x+w]
            
            if cropped is None or cropped.size == 0:
                print("[Document Crop] Crop failed, using full image")
                return self._encode_image_to_base64(image)
            
            print(f"[Document Crop] Cropped size: {cropped.shape[1]}x{cropped.shape[0]}")
            return self._encode_image_to_base64(cropped)
            
        except Exception as e:
            print(f"[Document Crop] Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _four_point_transform(self, image: np.ndarray, pts: np.ndarray) -> np.ndarray:
\
\
\
\
\
\
\
\
\
           
                                                                      
        rect = self._order_points(pts)
        (tl, tr, br, bl) = rect
        
                                    
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        
                                     
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
                                      
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype="float32")
        
                                                           
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        
        return warped
    
    def _order_points(self, pts: np.ndarray) -> np.ndarray:
\
\
\
\
\
\
\
\
           
        rect = np.zeros((4, 2), dtype="float32")
        
                                                                                  
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
                                                                                     
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect
    
    def _encode_image_to_base64(self, image: np.ndarray) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
           
        try:
            import base64
            
                                
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
                                  
            pil_image = Image.fromarray(image_rgb)
            
                               
            buffered = BytesIO()
            pil_image.save(buffered, format="JPEG", quality=95)
            image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            return {
                'success': True,
                'image_base64': f'data:image/jpeg;base64,{image_base64}',
                'width': image.shape[1],
                'height': image.shape[0]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


_face_service = None

def get_face_service() -> FaceDetectionService:
    global _face_service
    if _face_service is None:
        _face_service = FaceDetectionService()
    return _face_service
