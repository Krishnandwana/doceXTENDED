import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="dark">
      <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white antialiased overflow-x-hidden relative min-h-screen flex flex-col">
        {/* Grain Overlay */}
        <div className="fixed inset-0 pointer-events-none z-50 opacity-40 mix-blend-overlay"></div>
        
        {/* Background Gradient Ambience */}
        <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
          <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-primary to-orange-600 flex items-center justify-center">
                <span className="material-icons text-white text-[14px]">verified_user</span>
              </div>
              <span className="font-bold text-lg tracking-tight">DocVerify</span>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="material-icons">menu</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow flex flex-col justify-center max-w-md mx-auto px-6 pt-24 pb-12 w-full z-10">
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center space-y-8">
            {/* 3D Card Animation */}
            <div className="relative w-full h-64 flex items-center justify-center perspective-[1000px]">
              {/* Back Card */}
              <div className="absolute w-40 h-56 bg-surface-dark border border-white/5 rounded-xl transform -rotate-12 translate-x-[-40px] translate-y-2 opacity-60 shadow-2xl animate-float-slow">
                <div className="h-full w-full bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4">
                  <div className="w-full h-2 bg-white/10 rounded mb-2"></div>
                  <div className="w-2/3 h-2 bg-white/10 rounded"></div>
                </div>
              </div>
              
              {/* Middle Card */}
              <div className="absolute w-40 h-56 bg-surface-dark border border-white/10 rounded-xl transform rotate-6 translate-x-[30px] translate-y-[-10px] opacity-80 shadow-2xl animate-float-delayed">
                <div className="h-full w-full bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-white/10"></div>
                    <div className="w-full h-2 bg-white/10 rounded"></div>
                    <div className="w-full h-2 bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>
              
              {/* Front Card */}
              <div className="absolute w-48 h-64 bg-[#111] border border-primary/40 rounded-xl shadow-[0_0_30px_-5px_rgba(255,121,26,0.15)] transform rotate-[-3deg] z-20 flex flex-col overflow-hidden animate-float">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"></div>
                <div className="p-5 flex flex-col h-full relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center">
                      <div className="w-6 h-4 bg-gradient-to-r from-yellow-600/50 to-yellow-300/50 rounded-sm"></div>
                    </div>
                    <span className="material-icons text-primary text-xl">check_circle</span>
                  </div>
                  <div className="space-y-3 mt-auto">
                    <div className="w-12 h-12 bg-white/5 rounded-full mb-4 border border-white/5"></div>
                    <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
                    <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                    <div className="h-2 w-full bg-white/5 rounded-full mt-4"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4 mt-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-2"></span>
                <span className="text-xs font-medium text-primary tracking-wide uppercase">AI Engine v2.0 Live</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-[1.15] tracking-tight glow-text">
                AI-Powered <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Document Verification</span>
              </h1>
              <p className="text-gray-400 text-base leading-relaxed max-w-[320px] mx-auto font-medium">
                Instant authentication for Aadhaar, PAN, and Driver's Licenses using advanced computer vision.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col w-full gap-4 pt-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="group relative w-full h-14 bg-background-dark border border-primary text-white font-bold rounded-lg overflow-hidden transition-all duration-300 btn-glow active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <span className="material-icons text-primary group-hover:text-white transition-colors text-xl">upload_file</span>
                  Upload Document
                </span>
              </button>
              <button 
                onClick={() => navigate('/api-docs')}
                className="w-full h-14 bg-transparent border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]"
              >
                View API Docs
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-6">Trusted by leading fintechs</p>
            <div className="flex justify-between items-center px-2 opacity-40 grayscale">
              <div className="flex items-center gap-1">
                <span className="material-icons text-xl">account_balance</span>
                <span className="font-bold text-sm">BankFirst</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-icons text-xl">verified_user</span>
                <span className="font-bold text-sm">SecurePay</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-icons text-xl">timeline</span>
                <span className="font-bold text-sm">Investo</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded border border-white/5">
                <span className="material-icons text-gray-400 text-sm">shield</span>
                <span className="text-[10px] text-gray-400 font-mono">ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded border border-white/5">
                <span className="material-icons text-gray-400 text-sm">lock</span>
                <span className="text-[10px] text-gray-400 font-mono">GDPR READY</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Scan Line Animation */}
        <div className="fixed bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent z-50"></div>
      </div>
    </div>
  );
};

export default LandingPage;
