#!/bin/bash

echo "====================================="
echo "   DocVerify Frontend Startup"
echo "====================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Creating .env file..."
    echo "REACT_APP_API_URL=http://localhost:8000" > .env
    echo "PORT=3005" >> .env
    echo "Created .env with default backend URL"
fi

echo ""
echo "Starting DocVerify Frontend..."
echo ""
echo "Frontend will be available at: http://localhost:3005"
echo "Press Ctrl+C to stop the server"
echo ""

npm start
