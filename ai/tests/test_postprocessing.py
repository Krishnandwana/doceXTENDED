import unittest

from ai.postprocessing.confidence_calibrator import calibrate_confidence
from ai.postprocessing.field_normalizer import normalize_document_fields
from ai.postprocessing.result_fusion import fuse_results


class TestPostprocessing(unittest.TestCase):
    def test_calibrate_bounds(self):
        self.assertGreaterEqual(calibrate_confidence(-1.0), 0.0)
        self.assertLessEqual(calibrate_confidence(2.0), 1.0)

    def test_field_normalization(self):
        fields = {
            "name": "rahul   sharma!!",
            "date_of_birth": "22-01-1992",
            "id_number": "abcde 1234 f",
        }
        out = normalize_document_fields(fields)
        self.assertEqual(out["name"], "Rahul Sharma")
        self.assertEqual(out["date_of_birth"], "1992-01-22")
        self.assertEqual(out["id_number"], "ABCDE1234F")

    def test_result_fusion(self):
        result = fuse_results({
            "ocr": {"confidence": 0.8},
            "parser": {"confidence": 0.7},
            "classifier": {"confidence": 0.9},
            "face_match": {"confidence": 0.75},
            "quality": {"confidence": 0.8},
        })
        self.assertTrue(result["success"])
        self.assertIn(result["decision"], {"approve", "review", "reject"})


if __name__ == "__main__":
    unittest.main()

