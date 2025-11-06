/**
 * Gemini AI Service - Direct Frontend Integration
 *
 * WARNING: This implementation exposes the API key in the frontend.
 * Security measures applied:
 * 1. API key should be restricted to your domain in Google Cloud Console
 * 2. Set daily usage quotas
 * 3. Monitor API usage regularly
 *
 * For production with sensitive data, consider using a backend proxy.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("REACT_APP_GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Convert image file to base64 for Gemini API
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract text and data from document using Gemini Vision
 */
export const extractDocumentData = async (imageFile, documentType) => {
  // Try multiple model names in order of preference
  const modelNames = [
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro"
  ];

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Convert image to format Gemini expects
      const imagePart = await fileToGenerativePart(imageFile);

      // Create document-specific prompt
      const prompt = getPromptForDocumentType(documentType);

      // Generate content
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log(`Success with model: ${modelName}`);

      // Parse the response
      return parseGeminiResponse(text, documentType);
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // Try next model
      continue;
    }
  }

  // If all models failed, throw the last error
  console.error("All Gemini models failed. Last error:", lastError);
  throw new Error(`Failed to extract data. Please check your API key and ensure you have access to Gemini models. Error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Get appropriate prompt based on document type
 */
const getPromptForDocumentType = (documentType) => {
  const prompts = {
    aadhaar: `
      Analyze this Aadhaar card image and extract the following information in JSON format:
      {
        "name": "Full name as shown on card",
        "aadhaar_number": "12-digit Aadhaar number",
        "dob": "Date of birth (DD/MM/YYYY)",
        "gender": "Male/Female",
        "address": "Complete address",
        "has_photo": true/false,
        "is_valid": true/false,
        "validation_issues": ["list of any issues found"]
      }

      Check for:
      - Clear photo visibility
      - Readable text
      - Valid Aadhaar number format (12 digits)
      - Complete address

      Return ONLY valid JSON, no additional text.
    `,
    pan: `
      Analyze this PAN card image and extract the following information in JSON format:
      {
        "name": "Full name as shown on card",
        "pan_number": "10-character PAN number",
        "dob": "Date of birth (DD/MM/YYYY)",
        "father_name": "Father's name",
        "has_photo": true/false,
        "is_valid": true/false,
        "validation_issues": ["list of any issues found"]
      }

      Check for:
      - Clear photo visibility
      - Readable text
      - Valid PAN format (5 letters, 4 digits, 1 letter)
      - Signature present

      Return ONLY valid JSON, no additional text.
    `,
    passport: `
      Analyze this Passport image and extract the following information in JSON format:
      {
        "name": "Full name",
        "passport_number": "Passport number",
        "dob": "Date of birth (DD/MM/YYYY)",
        "nationality": "Nationality",
        "issue_date": "Date of issue",
        "expiry_date": "Expiry date",
        "place_of_birth": "Place of birth",
        "has_photo": true/false,
        "is_valid": true/false,
        "validation_issues": ["list of any issues found"]
      }

      Return ONLY valid JSON, no additional text.
    `,
    driving_license: `
      Analyze this Driving License image and extract the following information in JSON format:
      {
        "name": "Full name",
        "dl_number": "License number",
        "dob": "Date of birth (DD/MM/YYYY)",
        "issue_date": "Date of issue",
        "expiry_date": "Expiry date",
        "address": "Address",
        "blood_group": "Blood group if visible",
        "vehicle_classes": "Authorized vehicle classes",
        "has_photo": true/false,
        "is_valid": true/false,
        "validation_issues": ["list of any issues found"]
      }

      Return ONLY valid JSON, no additional text.
    `,
    voter_id: `
      Analyze this Voter ID card image and extract the following information in JSON format:
      {
        "name": "Full name",
        "epic_number": "EPIC/Voter ID number",
        "dob": "Date of birth (DD/MM/YYYY)",
        "gender": "Male/Female",
        "address": "Address",
        "has_photo": true/false,
        "is_valid": true/false,
        "validation_issues": ["list of any issues found"]
      }

      Return ONLY valid JSON, no additional text.
    `
  };

  return prompts[documentType] || prompts.aadhaar;
};

/**
 * Parse Gemini response and extract JSON
 */
const parseGeminiResponse = (responseText, documentType) => {
  try {
    // Try to extract JSON from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // If no JSON found, try to parse the entire response
      jsonMatch = [responseText];
    }

    const jsonStr = jsonMatch[0];
    const data = JSON.parse(jsonStr);

    // Add document type
    data.document_type = documentType;

    // Calculate confidence score based on completeness
    const requiredFields = getRequiredFields(documentType);
    const filledFields = requiredFields.filter(field => data[field] && data[field] !== "");
    const confidence = (filledFields.length / requiredFields.length) * 100;

    data.confidence_score = Math.round(confidence);

    return {
      success: true,
      data: data,
      extracted_text: responseText,
      confidence_score: data.confidence_score
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    console.log("Raw response:", responseText);

    // Return raw text if parsing fails
    return {
      success: false,
      error: "Failed to parse extracted data",
      raw_text: responseText,
      confidence_score: 0
    };
  }
};

/**
 * Get required fields for each document type
 */
const getRequiredFields = (documentType) => {
  const fieldMap = {
    aadhaar: ['name', 'aadhaar_number', 'dob', 'gender', 'address'],
    pan: ['name', 'pan_number', 'dob', 'father_name'],
    passport: ['name', 'passport_number', 'dob', 'nationality'],
    driving_license: ['name', 'dl_number', 'dob', 'address'],
    voter_id: ['name', 'epic_number', 'dob', 'gender']
  };

  return fieldMap[documentType] || fieldMap.aadhaar;
};

/**
 * Validate document data
 */
export const validateDocument = (data, documentType) => {
  const validators = {
    aadhaar: (d) => {
      const issues = [];

      if (!d.aadhaar_number || !/^\d{12}$/.test(d.aadhaar_number.replace(/[^0-9]/g, ''))) {
        issues.push("Invalid Aadhaar number format");
      }

      if (!d.name || d.name.length < 3) {
        issues.push("Invalid or missing name");
      }

      if (!d.dob) {
        issues.push("Missing date of birth");
      }

      if (!d.has_photo) {
        issues.push("Photo not clearly visible");
      }

      return issues;
    },

    pan: (d) => {
      const issues = [];

      if (!d.pan_number || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(d.pan_number.replace(/\s/g, ''))) {
        issues.push("Invalid PAN number format");
      }

      if (!d.name || d.name.length < 3) {
        issues.push("Invalid or missing name");
      }

      if (!d.dob) {
        issues.push("Missing date of birth");
      }

      return issues;
    },

    passport: (d) => {
      const issues = [];

      if (!d.passport_number) {
        issues.push("Missing passport number");
      }

      if (!d.name) {
        issues.push("Missing name");
      }

      if (!d.expiry_date) {
        issues.push("Missing expiry date");
      }

      return issues;
    },

    driving_license: (d) => {
      const issues = [];

      if (!d.dl_number) {
        issues.push("Missing license number");
      }

      if (!d.name) {
        issues.push("Missing name");
      }

      if (!d.expiry_date) {
        issues.push("Missing expiry date");
      }

      return issues;
    },

    voter_id: (d) => {
      const issues = [];

      if (!d.epic_number) {
        issues.push("Missing EPIC number");
      }

      if (!d.name) {
        issues.push("Missing name");
      }

      if (!d.dob) {
        issues.push("Missing date of birth");
      }

      return issues;
    }
  };

  const validator = validators[documentType] || validators.aadhaar;
  return validator(data);
};

export default {
  extractDocumentData,
  validateDocument
};
