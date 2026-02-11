import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewDashboard = () => {
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file.name);
    }
  };

  return (
    <div className="dark">
      <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white antialiased selection:bg-primary selection:text-white overflow-hidden">
        <div className="flex h-screen w-full flex-col md:flex-row relative">
          {/* Sidebar */}
          <aside className="hidden md:flex w-20 flex-col items-center bg-sidebar-dark border-r border-white/5 py-6 z-20">
            <div className="mb-8 text-primary">
              <span className="material-symbols-outlined !text-4xl">security</span>
            </div>
            <nav className="flex flex-1 flex-col gap-6 w-full">
              <button 
                onClick={() => navigate('/dashboard')}
                className="group relative flex h-12 w-full items-center justify-center"
              >
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_#ff791a]"></div>
                <span className="material-symbols-outlined text-primary" title="Dashboard">dashboard</span>
              </button>
              <button 
                onClick={() => navigate('/id-verification')}
                className="group relative flex h-12 w-full items-center justify-center text-gray-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" title="ID Verification">badge</span>
              </button>
              <button 
                onClick={() => navigate('/document-verification')}
                className="group relative flex h-12 w-full items-center justify-center text-gray-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" title="Document Verification">description</span>
              </button>
              <button 
                onClick={() => navigate('/api-docs')}
                className="group relative flex h-12 w-full items-center justify-center text-gray-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" title="API Keys">key</span>
              </button>
            </nav>
            <div className="mt-auto flex flex-col gap-6">
              <button className="group relative flex h-12 w-full items-center justify-center text-gray-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined" title="Settings">settings</span>
              </button>
              <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10">
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-full relative overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-background-dark/80 backdrop-blur-md z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <button className="md:hidden text-white/80 hover:text-white">
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary md:hidden">security</span>
                  <h1 className="text-xl font-bold tracking-tight text-white">DocVerify</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="relative text-white/60 hover:text-white transition-colors">
                  <span className="absolute -right-1 -top-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <div className="h-8 w-8 md:hidden overflow-hidden rounded-full border border-white/10">
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-4 pb-24 md:p-8">
              <div className="mx-auto max-w-2xl flex flex-col gap-6">
                
                {/* Quick Actions */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => navigate('/id-verification')}
                    className="group relative flex flex-col items-start rounded-xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-6 text-left transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,121,26,0.2)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">badge</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">ID Verification</h3>
                    <p className="text-sm text-gray-400">Face capture & matching with document authentication</p>
                  </button>

                  <button
                    onClick={() => navigate('/document-verification')}
                    className="group relative flex flex-col items-start rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent p-6 text-left transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Document Analysis</h3>
                    <p className="text-sm text-gray-400">AI-powered OCR and document verification</p>
                  </button>
                </section>

                {/* Upload Dropzone */}
                <section className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-surface-dark/50 px-6 py-10 text-center transition-all duration-300 hover:border-primary/50 hover:bg-surface-dark hover:shadow-[0_0_20px_rgba(255,121,26,0.1)]">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-primary shadow-[0_0_15px_rgba(255,121,26,0.1)] transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,121,26,0.3)]">
                    <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">Quick Upload</h2>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
                    Drag and drop your documents here, or tap to browse securely.
                  </p>
                  <button 
                    onClick={() => document.getElementById('file-upload').click()}
                    className="bg-primary hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-[0_4px_14px_rgba(255,121,26,0.4)] hover:shadow-[0_6px_20px_rgba(255,121,26,0.6)] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">folder_open</span>
                    Select File
                  </button>
                </section>

                {/* Active Processing Card */}
                <section className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-dark shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">Analysis in Progress</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">ID: #8839-XJ</span>
                  </div>

                  {/* 3D Visualization */}
                  <div className="relative h-64 w-full bg-black/40 flex items-center justify-center perspective-container">
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at center, #ff791a 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                    
                    {/* 3D Document */}
                    <div className="rotate-3d-doc relative h-32 w-24 border border-primary/40 bg-primary/5 backdrop-blur-sm shadow-[0_0_30px_rgba(255,121,26,0.2)]">
                      <div className="absolute top-4 left-3 right-3 h-1 bg-primary/30 rounded-full"></div>
                      <div className="absolute top-7 left-3 right-8 h-1 bg-primary/30 rounded-full"></div>
                      <div className="absolute top-10 left-3 right-3 h-1 bg-primary/30 rounded-full"></div>
                      <div className="absolute top-13 left-3 right-5 h-1 bg-primary/30 rounded-full"></div>
                      <div className="absolute -top-1 -left-1 h-3 w-3 border-l-2 border-t-2 border-primary"></div>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 border-r-2 border-b-2 border-primary"></div>
                      <div className="absolute -top-1 -right-1 h-3 w-3 border-r-2 border-t-2 border-primary"></div>
                      <div className="absolute -bottom-1 -left-1 h-3 w-3 border-l-2 border-b-2 border-primary"></div>
                    </div>

                    {/* Scanning Beam */}
                    <div className="absolute w-full h-1/3 left-0 animate-scan scan-beam z-10 pointer-events-none"></div>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between bg-surface-dark">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">contract_v2_final.pdf</span>
                      <span className="text-xs text-gray-500">2.4 MB • Scanning layers...</span>
                    </div>
                    <div className="text-primary font-mono text-sm font-bold">78%</div>
                  </div>
                </section>

                {/* Recent Activity */}
                <section>
                  <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                  <div className="flex flex-col gap-3">
                    {/* Verified Item */}
                    <div className="group flex items-center gap-4 rounded-lg border border-white/5 bg-surface-dark p-3 transition-colors hover:border-white/10 hover:bg-white/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                        <span className="material-symbols-outlined text-[20px]">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-bold text-white">passport_front.jpg</h4>
                        <p className="text-xs text-gray-500">Uploaded 2 mins ago</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-[0_0_10px_rgba(255,121,26,0.15)]">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Verified
                      </div>
                    </div>

                    {/* Processing Item */}
                    <div className="group flex items-center gap-4 rounded-lg border border-white/5 bg-surface-dark p-3 transition-colors hover:border-white/10 hover:bg-white/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">image</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-bold text-white">evidence_photo_04.png</h4>
                        <p className="text-xs text-gray-500">Uploaded 1 hr ago</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-gray-400">
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Queued
                      </div>
                    </div>

                    {/* Another Verified Item */}
                    <div className="group flex items-center gap-4 rounded-lg border border-white/5 bg-surface-dark p-3 transition-colors hover:border-white/10 hover:bg-white/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-bold text-white">financial_report_q3.pdf</h4>
                        <p className="text-xs text-gray-500">Uploaded yesterday</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-[0_0_10px_rgba(255,121,26,0.15)]">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Verified
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Floating Action Button */}
            <button className="md:hidden absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(255,121,26,0.5)] flex items-center justify-center z-30 hover:scale-105 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            </button>
          </main>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
