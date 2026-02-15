@echo off
REM Download face-api.js models
REM These models are required for face detection and recognition

echo ================================================
echo   Downloading face-api.js Models
echo ================================================
echo.

set MODELS_DIR=frontend\public\models
set BASE_URL=https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights

REM Create models directory if it doesn't exist
if not exist "%MODELS_DIR%" (
    echo Creating models directory: %MODELS_DIR%
    mkdir "%MODELS_DIR%"
)

cd "%MODELS_DIR%"

echo.
echo Downloading models to: %CD%
echo.

REM TinyFaceDetector models
echo [1/9] Downloading tiny_face_detector_model-weights_manifest.json...
curl -L -O %BASE_URL%/tiny_face_detector_model-weights_manifest.json

echo [2/9] Downloading tiny_face_detector_model-shard1...
curl -L -O %BASE_URL%/tiny_face_detector_model-shard1

REM SSD Mobilenet models
echo [3/9] Downloading ssd_mobilenetv1_model-weights_manifest.json...
curl -L -O %BASE_URL%/ssd_mobilenetv1_model-weights_manifest.json

echo [4/9] Downloading ssd_mobilenetv1_model-shard1...
curl -L -O %BASE_URL%/ssd_mobilenetv1_model-shard1

echo [5/9] Downloading ssd_mobilenetv1_model-shard2...
curl -L -O %BASE_URL%/ssd_mobilenetv1_model-shard2

REM Face Landmark models
echo [6/9] Downloading face_landmark_68_model-weights_manifest.json...
curl -L -O %BASE_URL%/face_landmark_68_model-weights_manifest.json

echo [7/9] Downloading face_landmark_68_model-shard1...
curl -L -O %BASE_URL%/face_landmark_68_model-shard1

REM Face Recognition models
echo [8/9] Downloading face_recognition_model-weights_manifest.json...
curl -L -O %BASE_URL%/face_recognition_model-weights_manifest.json

echo [9/9] Downloading face_recognition_model-shard1...
curl -L -O %BASE_URL%/face_recognition_model-shard1

echo [9/9] Downloading face_recognition_model-shard2...
curl -L -O %BASE_URL%/face_recognition_model-shard2

cd ..\..\..

echo.
echo ================================================
echo   Download Complete!
echo ================================================
echo.
echo Models have been downloaded to: %MODELS_DIR%
echo You can now use face verification in your app.
echo.
pause
