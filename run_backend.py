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

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))


def _configure_paddle_paths() -> None:
    """
    Force Paddle cache/data paths into project workspace to avoid
    permission issues on restricted user profile directories.
    """
    paddle_home = os.path.join(PROJECT_ROOT, "data", "paddle_home")
    xdg_cache = os.path.join(PROJECT_ROOT, "data", ".cache")

    os.makedirs(paddle_home, exist_ok=True)
    os.makedirs(xdg_cache, exist_ok=True)

    project_data_home = os.path.join(PROJECT_ROOT, "data")
    os.makedirs(project_data_home, exist_ok=True)

    # Some Paddle internals still resolve cache paths from home/userprofile.
    os.environ["HOME"] = project_data_home
    os.environ["USERPROFILE"] = project_data_home
    drive, tail = os.path.splitdrive(project_data_home)
    os.environ["HOMEDRIVE"] = drive or os.environ.get("HOMEDRIVE", "C:")
    os.environ["HOMEPATH"] = tail or os.environ.get("HOMEPATH", "\\")

    os.environ["PADDLE_HOME"] = paddle_home
    os.environ["XDG_CACHE_HOME"] = xdg_cache
    os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")


def main():
    """Run the FastAPI server"""
    _configure_paddle_paths()

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
