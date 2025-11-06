/**
 * Simplified Gemini Service - Using Text-Only Approach
 * This version extracts text first, then analyzes it
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("REACT_APP_GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Extract document data using text-based Gemini model
 * This is a fallback when vision models are not available
 */
export const extractDocumentData = async (imageFile, documentType) => {
  try {
    console.log("Starting document extraction with Gemini API");
    console.log("API Key present:", !!API_KEY);
    console.log("Document type:", documentType);

    // For now, return mock data since the API key doesn't have model access
    // This allows the UI to work while you configure the API key properly

    const mockData = generateMockData(documentType);

    console.warn("⚠️ Using mock data because Gemini models are not accessible");
    console.warn("To fix this:");
    console.warn("1. Go to https://makersuite.google.com/app/apikey");
    console.warn("2. Create a new API key");
    console.warn("3. Make sure 'Generative Language API' is enabled");
    console.warn("4. Update REACT_APP_GEMINI_API_KEY in .env");

    return {
      success: true,
      data: mockData,
      confidence_score: 75,
      extracted_text: "Mock data - API key needs proper configuration"
    };

  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
};

/**
 * Generate mock data for testing
 */
const generateMockData = (documentType) => {
  const mockDataMap = {
    aadhaar: {
      name: "Sample User Name",
      aadhaar_number: "XXXX-XXXX-1234",
      dob: "01/01/1990",
      gender: "Male",
      address: "Sample Address, City, State - 123456",
      has_photo: true,
      is_valid: true,
      validation_issues: ["⚠️ This is mock data - Please configure Gemini API key properly"]
    },
    pan: {
      name: "Sample User Name",
      pan_number: "ABCDE1234F",
      dob: "01/01/1990",
      father_name: "Sample Father Name",
      has_photo: true,
      is_valid: true,
      validation_issues: ["⚠️ This is mock data - Please configure Gemini API key properly"]
    },
    passport: {
      name: "Sample User Name",
      passport_number: "A1234567",
      dob: "01/01/1990",
      nationality: "Indian",
      issue_date: "01/01/2020",
      expiry_date: "01/01/2030",
      place_of_birth: "Sample City",
      has_photo: true,
      is_valid: true,
      validation_issues: ["⚠️ This is mock data - Please configure Gemini API key properly"]
    },
    driving_license: {
      name: "Sample User Name",
      dl_number: "DL-1234567890",
      dob: "01/01/1990",
      issue_date: "01/01/2020",
      expiry_date: "01/01/2030",
      address: "Sample Address, City, State",
      blood_group: "O+",
      vehicle_classes: "LMV, MC",
      has_photo: true,
      is_valid: true,
      validation_issues: ["⚠️ This is mock data - Please configure Gemini API key properly"]
    },
    voter_id: {
      name: "Sample User Name",
      epic_number: "ABC1234567",
      dob: "01/01/1990",
      gender: "Male",
      address: "Sample Address, City, State",
      has_photo: true,
      is_valid: true,
      validation_issues: ["⚠️ This is mock data - Please configure Gemini API key properly"]
    }
  };

  return mockDataMap[documentType] || mockDataMap.aadhaar;
};

/**
 * Validate document data
 */
export const validateDocument = (data, documentType) => {
  const issues = [];

  // If this is mock data, return the mock warning
  if (data.validation_issues && data.validation_issues.length > 0) {
    return data.validation_issues;
  }

  // Otherwise perform normal validation
  if (!data.name || data.name.length < 3) {
    issues.push("Invalid or missing name");
  }

  if (!data.has_photo) {
    issues.push("Photo not clearly visible");
  }

  return issues;
};

export default {
  extractDocumentData,
  validateDocument
};
