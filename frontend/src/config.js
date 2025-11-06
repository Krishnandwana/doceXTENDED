const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  API_ENDPOINTS: {
    VERIFY: '/verify',
    UPLOAD: '/api/documents/upload',
    PROCESS: '/api/documents/process',
    STATUS: '/api/documents/status',
    RESULTS: '/api/documents/results',
    HEALTH: '/api/health'
  }
};

export default config;