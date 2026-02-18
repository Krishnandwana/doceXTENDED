"""
DocVerify Backend Runner
Convenient script to run the FastAPI backend server
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    """Run the FastAPI server"""
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))

    print("=" * 60)
    print("DocVerify Backend Server")
    print("=" * 60)
    print(f"Starting server at http://{host}:{port}")
    print(f"API Documentation: http://{host}:{port}/docs")
    print(f"Alternative Docs: http://{host}:{port}/redoc")
    print("=" * 60)
    print()

    # Run server
    uvicorn.run(
        "backend.api.main:app",
        host=host,
        port=port,
        reload=False,  # Disabled to prevent crashes during EasyOCR init
        log_level="info"
    )


if __name__ == "__main__":
    main()
