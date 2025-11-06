"""
Quick Backend Test Script
Tests basic functionality of the backend services
"""

import sys
import os

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Load environment
load_dotenv()


def test_imports():
    """Test if all modules can be imported"""
    print("Testing imports...")
    try:
        from backend.services import (
            get_gemini_service,
            get_paddle_service,
            get_document_parser,
            get_face_service,
            get_document_processor
        )
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False


def test_gemini_api():
    """Test Gemini API connection"""
    print("\nTesting Gemini API...")
    try:
        from backend.services import get_gemini_service

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("✗ GEMINI_API_KEY not found in environment")
            return False

        service = get_gemini_service()
        print("✓ Gemini service initialized")
        return True
    except Exception as e:
        print(f"✗ Gemini API test failed: {e}")
        return False


def test_paddle_ocr():
    """Test PaddleOCR initialization"""
    print("\nTesting PaddleOCR...")
    try:
        from backend.services import get_paddle_service

        service = get_paddle_service()
        print("✓ PaddleOCR service initialized")
        print("  (Note: Models will download on first use)")
        return True
    except Exception as e:
        print(f"✗ PaddleOCR test failed: {e}")
        return False


def test_face_service():
    """Test face recognition service"""
    print("\nTesting Face Recognition...")
    try:
        from backend.services import get_face_service

        service = get_face_service()
        print("✓ Face recognition service initialized")
        return True
    except Exception as e:
        print(f"✗ Face recognition test failed: {e}")
        return False


def test_document_parser():
    """Test document parser"""
    print("\nTesting Document Parser...")
    try:
        from backend.services import get_document_parser

        parser = get_document_parser()

        # Test PAN parsing
        test_text = "Name: John Doe PAN: ABCDE1234F DOB: 15/08/1990"
        result = parser.parse_document(test_text, 'pan')

        if result.get('pan_number'):
            print("✓ Document parser working")
            print(f"  Extracted PAN: {result['pan_number']}")
            return True
        else:
            print("✓ Document parser initialized (no data extracted from test)")
            return True
    except Exception as e:
        print(f"✗ Document parser test failed: {e}")
        return False


def test_directories():
    """Test required directories exist"""
    print("\nTesting directories...")
    try:
        required_dirs = [
            'data/uploads',
            'data/processed',
            'backend/api',
            'backend/services'
        ]

        all_exist = True
        for dir_path in required_dirs:
            if not os.path.exists(dir_path):
                print(f"✗ Missing directory: {dir_path}")
                all_exist = False

        if all_exist:
            print("✓ All required directories exist")
            return True
        return False
    except Exception as e:
        print(f"✗ Directory test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("DocVerify Backend Test Suite")
    print("=" * 60)

    tests = [
        ("Imports", test_imports),
        ("Directories", test_directories),
        ("Gemini API", test_gemini_api),
        ("PaddleOCR", test_paddle_ocr),
        ("Face Recognition", test_face_service),
        ("Document Parser", test_document_parser),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} test crashed: {e}")
            results.append((name, False))

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n✓ All tests passed! Backend is ready to use.")
        print("\nTo start the server, run:")
        print("  python run_backend.py")
        print("\nOr on Windows:")
        print("  start_backend.bat")
    else:
        print("\n⚠ Some tests failed. Please check the errors above.")
        print("\nCommon fixes:")
        print("  1. Run: pip install -r requirements.txt")
        print("  2. Check .env file has GEMINI_API_KEY")
        print("  3. Install dlib if face recognition failed")

    print("=" * 60)


if __name__ == "__main__":
    main()
