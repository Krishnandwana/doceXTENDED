import React from 'react';
import { generatePDF } from '../utils/pdfGenerator';

const VerificationResult = ({ result, error }) => {
  if (error) {
    return (
      <div className="alert alert-danger mt-4" role="alert">
        {error}
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { ocr_results, face_analysis } = result;

  const handleDownload = () => {
    generatePDF(result);
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">Verification Result</h5>

        {ocr_results && (
          <div className="mt-3">
            <h6>OCR Results:</h6>
            <pre className="bg-light p-3 rounded">{ocr_results}</pre>
          </div>
        )}

        {face_analysis && (
          <div className="mt-3">
            <h6>Face Analysis:</h6>
            <p>
              Face detected: {face_analysis.face_detected ? 'Yes' : 'No'}
            </p>
            {face_analysis.face_detected && (
              <img src={`data:image/jpeg;base64,${face_analysis.face_image}`} alt="Detected Face" className="img-fluid rounded" />
            )}
          </div>
        )}

        <button className="btn btn-primary mt-3" onClick={handleDownload}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default VerificationResult;