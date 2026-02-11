
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = (verificationData) => {
  const doc = new jsPDF();

  doc.text('Verification Report', 20, 20);

  if (verificationData.ocr_results) {
    doc.text('OCR Results:', 20, 30);
    doc.autoTable({
      startY: 40,
      head: [['Field', 'Value']],
      body: Object.entries(JSON.parse(verificationData.ocr_results)).map(([key, value]) => [key, value]),
    });
  }

  if (verificationData.face_analysis && verificationData.face_analysis.face_detected) {
    doc.addPage();
    doc.text('Face Analysis', 20, 20);
    doc.text('Face Detected: Yes', 20, 30);
    doc.addImage(
      `data:image/jpeg;base64,${verificationData.face_analysis.face_image}`,
      'JPEG',
      20,
      40,
      150,
      150
    );
  }

  doc.save('verification-report.pdf');
};
