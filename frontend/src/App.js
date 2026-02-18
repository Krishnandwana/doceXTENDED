import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import NewDashboard from './pages/NewDashboard';
import FaceMatching from './pages/FaceMatching';
import ApiDocumentation from './pages/ApiDocumentation';
import AIPipeline from './pages/AIPipeline';
import IDVerificationWorking from './pages/IDVerificationWorking';
import DocumentVerificationWorking from './pages/DocumentVerificationWorking';
import FaceVerificationTest from './pages/FaceVerificationTest';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<NewDashboard />} />
        
        {/* Working Verification Routes with Backend Integration */}
        <Route path="/id-verification" element={<IDVerificationWorking />} />
        <Route path="/document-verification" element={<DocumentVerificationWorking />} />
        <Route path="/face-matching" element={<FaceMatching />} />
        
        {/* Face Verification Test Page */}
        <Route path="/face-test" element={<FaceVerificationTest />} />
        
        {/* Info Pages */}
        <Route path="/api-docs" element={<ApiDocumentation />} />
        <Route path="/pipeline" element={<AIPipeline />} />
      </Routes>
    </Router>
  );
}

export default App;
