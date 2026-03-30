import unittest

from ai.name_id_extractor import NameIDExtractor


class TestNameIDExtractor(unittest.TestCase):
    def setUp(self) -> None:
        self.extractor = NameIDExtractor()

    def test_extract_pan(self):
        text = "INCOME TAX DEPARTMENT\nRAHUL SHARMA\nDOB 22/01/1992\nABCDE1234F"
        result = self.extractor.extract(text, "pan")
        self.assertTrue(result["success"])
        self.assertEqual(result["fields"]["id_number"], "ABCDE1234F")
        self.assertEqual(result["fields"]["date_of_birth"], "22/01/1992")

    def test_extract_aadhaar_generic(self):
        text = "Government of India\nRANI KUMARI\n1234 5678 9012"
        result = self.extractor.extract(text, "unknown")
        self.assertTrue(result["success"])
        self.assertEqual(result["fields"]["id_number"], "123456789012")


if __name__ == "__main__":
    unittest.main()

