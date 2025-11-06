import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import IDVerification from './pages/IDVerification';
import DocumentVerification from './pages/DocumentVerification';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/id-verification" element={<IDVerification />} />
          <Route path="/document-verification" element={<DocumentVerification />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
