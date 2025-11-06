@echo off
echo =====================================
echo    DocVerify Frontend Startup
echo =====================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Creating .env file...
    echo REACT_APP_API_URL=http://localhost:8000 > .env
    echo PORT=3005 >> .env
    echo Created .env with default backend URL
)

echo.
echo Starting DocVerify Frontend...
echo.
echo Frontend will be available at: http://localhost:3005
echo Press Ctrl+C to stop the server
echo.

call npm start
