@echo off
echo ====================================
echo   DocVerify Backend Server
echo ====================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found!
    echo Creating virtual environment...
    py -3.11 -m venv venv
    echo.
    echo Installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    echo.
) else (
    call venv\Scripts\activate.bat
)

echo Starting FastAPI server...
echo API Docs will be available at: http://localhost:8000/docs
echo.

rem Use the python from the activated venv
python run_backend.py

pause