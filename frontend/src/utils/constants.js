// Application constants
export const APP_NAME = 'DocVerify Platform';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Document types supported by the system
export const DOCUMENT_TYPES = {
  AADHAAR: {
    value: 'aadhaar',
    label: 'Aadhaar Card',
    description: 'Indian national identity card',
    icon: '🆔',
  },
  PAN: {
    value: 'pan',
    label: 'PAN Card',
    description: 'Permanent Account Number card',
    icon: '💳',
  },
  DRIVING_LICENSE: {
    value: 'driving_license',
    label: 'Driving License',
    description: 'Indian driving license',
    icon: '🚗',
  },
  PASSPORT: {
    value: 'passport',
    label: 'Passport',
    description: 'Indian passport',
    icon: '📘',
  },
};

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'application/pdf'],
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.pdf'],
};

// Verification statuses
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

// Risk levels for document authenticity
export const RISK_LEVELS = {
  LOW: {
    value: 'low',
    label: 'Low Risk',
    color: 'success',
    threshold: 85,
    description: 'Document appears authentic',
  },
  MEDIUM: {
    value: 'medium',
    label: 'Medium Risk',
    color: 'warning',
    threshold: 60,
    description: 'Some suspicious characteristics detected',
  },
  HIGH: {
    value: 'high',
    label: 'High Risk',
    color: 'error',
    threshold: 0,
    description: 'Multiple indicators of potential forgery',
  },
};

// Face matching confidence thresholds
export const FACE_MATCHING = {
  HIGH_CONFIDENCE: 0.85,
  MEDIUM_CONFIDENCE: 0.70,
  LOW_CONFIDENCE: 0.50,
  REJECTION_THRESHOLD: 0.30,
};

// UI Colors and themes
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
};

// Navigation routes
export const ROUTES = {
  DASHBOARD: '/',
  ID_VERIFICATION: '/id-verification',
  DOCUMENT_VERIFICATION: '/document-verification',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_PREFERENCES: 'userPreferences',
  RECENT_VERIFICATIONS: 'recentVerifications',
  THEME_MODE: 'themeMode',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Cannot connect to the server. Please check your internet connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  FILE_TOO_LARGE: `File size must be less than ${FILE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: 'Please upload a valid image or PDF file',
  PROCESSING_FAILED: 'Document processing failed. Please try again.',
  FACE_MATCH_FAILED: 'Face matching failed. Please ensure good lighting and try again.',
  CAMERA_ACCESS_DENIED: 'Camera access denied. Please allow camera permissions.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  VERIFICATION_COMPLETE: 'Verification completed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
};

// Processing states
export const PROCESSING_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  ANALYZING: 'analyzing',
  FACE_MATCHING: 'face_matching',
  COMPLETED: 'completed',
  ERROR: 'error',
};

// Camera settings
export const CAMERA_CONFIG = {
  VIDEO_CONSTRAINTS: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
  },
  CAPTURE_FORMAT: 'image/jpeg',
  CAPTURE_QUALITY: 0.8,
};

// Verification steps for ID verification
export const ID_VERIFICATION_STEPS = [
  {
    id: 'upload',
    label: 'Upload ID Document',
    description: 'Upload a clear photo of your ID card, passport, or driver\'s license',
    icon: 'CloudUpload',
  },
  {
    id: 'extract',
    label: 'Data Extraction',
    description: 'We\'ll extract and verify the information from your document',
    icon: 'Assignment',
  },
  {
    id: 'face_verify',
    label: 'Live Verification',
    description: 'Take a selfie to match with your ID photo',
    icon: 'CameraAlt',
  },
  {
    id: 'complete',
    label: 'Verification Complete',
    description: 'Your identity has been verified and stored securely',
    icon: 'CheckCircle',
  },
];

// Analytics periods
export const ANALYTICS_PERIODS = {
  LAST_7_DAYS: '7d',
  LAST_30_DAYS: '30d',
  LAST_90_DAYS: '90d',
  LAST_YEAR: '365d',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Default values
export const DEFAULTS = {
  PAGINATION_SIZE: 10,
  DEBOUNCE_DELAY: 300,
  RETRY_DELAY: 1000,
  TOAST_DURATION: 5000,
  POLLING_INTERVAL: 2000,
};