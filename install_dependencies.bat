@echo off
echo ====================================
echo   DocVerify - Installing Dependencies
echo ====================================
echo.

REM Check Python version
py -3.11 --version
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv\" (
    echo Creating virtual environment...
    py -3.11 -m venv venv
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip
echo.

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt
echo.

echo ====================================
echo   Installation Complete!
echo ====================================
echo.
echo To run the backend:
echo   1. Run: start_backend.bat
echo   2. Or manually: python run_backend.py
echo.

pause