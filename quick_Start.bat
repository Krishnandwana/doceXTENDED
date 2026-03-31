@echo off
setlocal

echo ====================================
echo   DocVerify Quick Start
echo ====================================
echo.

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo [1/3] Starting backend...
if exist "start_backend.bat" (
    start "DocVerify Backend" cmd /k "cd /d "%ROOT%" && call start_backend.bat"
) else (
    start "DocVerify Backend" cmd /k "cd /d "%ROOT%" && call venv\Scripts\activate.bat && python run_backend.py"
)

echo [2/3] Starting frontend...
if not exist "frontend\node_modules\" (
    echo Frontend dependencies not found. Installing...
    call npm --prefix frontend install
)
start "DocVerify Frontend" cmd /k "cd /d "%ROOT%frontend" && npm start"

echo [3/3] Waiting briefly for services...
timeout /t 5 /nobreak >nul

echo.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3005
echo.
echo Quick start complete. Keep both terminal windows open.

endlocal
