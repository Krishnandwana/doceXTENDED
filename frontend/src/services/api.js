import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increased to 2 minutes for document processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    console.log('Making API request:', config.method?.toUpperCase(), config.url);
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },  //         Explore existing code
  (error) => {
    console.error('Request error:', error);


    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API error:', error.response?.status, error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to the backend server. Please ensure the backend is running on port 8000.');
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Could redirect to login page here
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error occurred during processing. Please try again.');
    }
    
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw error;
  }
);

// Health check
export const healthAPI = {
  check: () => api.get('/api/health'),
};

// Document verification APIs
export const documentAPI = {
  // Upload document
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Process document
  process: (documentId, documentType) => 
    api.post('/api/documents/process', {
      document_id: documentId,
      document_type: documentType,
    }),

  // Get processing status
  getStatus: (jobId) => api.get(`/api/documents/status/${jobId}`),

  // Get results
  getResults: (documentId) => api.get(`/api/documents/results/${documentId}`),

  // Simple verify endpoint (legacy compatibility)
  verifyDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Batch processing
  batchProcess: (documents) => 
    api.post('/api/documents/batch', { documents }),

  // Validate document data
  validate: (documentData, documentType) => 
    api.post('/api/documents/validate', {
      document_data: documentData,
      document_type: documentType,
    }),

  // Get report
  getReport: (documentId) => api.get(`/api/documents/report/${documentId}`),

  // Get supported document types
  getTypes: () => api.get('/api/documents/types'),

  // Delete document
  delete: (documentId) => api.delete(`/api/documents/${documentId}`),

  // OCR extraction
  extractOCR: (documentId, preprocess = true) => 
    api.post('/api/ocr/extract', {
      document_id: documentId,
      preprocess,
    }),

  // Health check specifically for document API
  checkHealth: () => api.get('/api/health'),
};

// Face verification APIs
export const faceAPI = {
  // Match faces
  match: (documentId, cameraImage) => 
    api.post('/api/face/match', {
      document_id: documentId,
      camera_image: cameraImage,
    }),

  // Extract face from document
  extractFace: (documentId) => 
    api.post(`/api/face/extract?document_id=${documentId}`),

  // Verify liveness
  verifyLiveness: (cameraImage) => 
    api.post('/api/face/verify-liveness', {
      camera_image: cameraImage,
    }),

  // Compare two faces directly
  compare: (documentPath, cameraImage) => 
    api.post('/api/face/compare', {
      document_path: documentPath,
      camera_image: cameraImage,
    }),
};

// User management APIs (for future implementation)
export const userAPI = {
  // Login
  login: (credentials) => 
    api.post('/api/auth/login', credentials),

  // Register
  register: (userData) => 
    api.post('/api/auth/register', userData),

  // Get profile
  getProfile: () => api.get('/api/auth/profile'),

  // Update profile
  updateProfile: (userData) => 
    api.put('/api/auth/profile', userData),

  // Logout
  logout: () => api.post('/api/auth/logout'),
};

// Analytics APIs (for future implementation)
export const analyticsAPI = {
  // Get verification statistics
  getStats: () => api.get('/api/analytics/stats'),

  // Get recent activity
  getActivity: (limit = 10) => 
    api.get(`/api/analytics/activity?limit=${limit}`),

  // Get usage trends
  getTrends: (period = '30d') => 
    api.get(`/api/analytics/trends?period=${period}`),
};

// Utility functions
export const apiUtils = {
  // Handle file upload progress
  uploadWithProgress: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      },
    });
  },

  // Convert base64 to blob
  base64ToBlob: (base64, mimeType) => {
    const bytes = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(bytes.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) {
      ia[i] = bytes.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  },

  // Format error messages
  formatError: (error) => {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
};

export default api;