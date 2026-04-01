import unittest

from ai.document_classifier import DocumentClassifier


class TestDocumentClassifier(unittest.TestCase):
    def setUp(self) -> None:
        self.classifier = DocumentClassifier()

    def test_classifies_pan(self):
        text = "INCOME TAX DEPARTMENT\nPERMANENT ACCOUNT NUMBER\nABCDE1234F"
        result = self.classifier.classify(text)
        self.assertTrue(result["success"])
        self.assertEqual(result["document_type"], "pan")

    def test_unknown_for_empty(self):
        result = self.classifier.classify("")
        self.assertFalse(result["success"])
        self.assertEqual(result["document_type"], "unknown")


if __name__ == "__main__":
    unittest.main()

