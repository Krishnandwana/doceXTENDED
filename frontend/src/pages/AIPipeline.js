import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AIPipeline = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="dark">
      <div className="font-display bg-dark-void text-white overflow-hidden h-screen w-full relative selection:bg-primary selection:text-white">
        {/* Background Ambience */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a100a] via-dark-void to-dark-void opacity-60"></div>
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent opacity-30"></div>
        </div>

        {/* Top Navigation */}
        <header className="absolute top-0 left-0 w-full z-30 p-4 pt-6 flex items-center justify-between bg-gradient-to-b from-dark-void/90 to-transparent">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-bold tracking-wide text-white/90 uppercase">DocVerify Engine</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-medium text-green-400 tracking-wider">PIPELINE ACTIVE</span>
            </div>
          </div>
          <button className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors backdrop-blur-sm">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        </header>

        {/* Main Pipeline Visualization */}
        <main className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-16 pb-32">
          {/* Connecting Lines Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center">
            <svg className="max-w-md" height="100%" width="100%">
              <defs>
                <linearGradient id="activeGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#ff791a', stopOpacity: 0}}></stop>
                  <stop offset="50%" style={{stopColor: '#ff791a', stopOpacity: 1}}></stop>
                  <stop offset="100%" style={{stopColor: '#ff791a', stopOpacity: 1}}></stop>
                </linearGradient>
                <linearGradient id="fadeLine" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#333', stopOpacity: 1}}></stop>
                  <stop offset="100%" style={{stopColor: '#333', stopOpacity: 0.2}}></stop>
                </linearGradient>
              </defs>
              {/* Central Spine Line */}
              <path d="M 50% 15% L 50% 85%" fill="none" stroke="url(#fadeLine)" strokeDasharray="4 4" strokeWidth="2"></path>
              {/* Active Data Flow */}
              <path d="M 50% 15% L 50% 65%" fill="none" stroke="url(#activeGradient)" strokeLinecap="round" strokeWidth="3"></path>
            </svg>
          </div>

          {/* Pipeline Nodes Container */}
          <div className="relative flex flex-col items-center gap-8 w-full max-w-xs">
            {/* Node 1: Upload (Completed) */}
            <div className="group relative flex items-center justify-center">
              <div className="relative z-10 flex items-center gap-4 bg-surface-dark border border-white/10 px-5 py-3 rounded-xl backdrop-blur-md">
                <div className="flex items-center justify-center size-8 rounded-full bg-white/10 text-white/60">
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                </div>
                <span className="text-sm font-medium text-white/60">Upload</span>
                <span className="absolute -right-1 -top-1 size-3 bg-green-500 rounded-full border-2 border-dark-void"></span>
              </div>
            </div>

            {/* Node 2: OCR (Completed) */}
            <div className="relative flex items-center justify-center">
              <div className="relative z-10 flex items-center gap-4 bg-surface-dark border border-white/10 px-5 py-3 rounded-xl backdrop-blur-md">
                <div className="flex items-center justify-center size-8 rounded-full bg-white/10 text-white/60">
                  <span className="material-symbols-outlined text-lg">document_scanner</span>
                </div>
                <span className="text-sm font-medium text-white/60">OCR Processing</span>
                <span className="absolute -right-1 -top-1 size-3 bg-green-500 rounded-full border-2 border-dark-void"></span>
              </div>
            </div>

            {/* Node 3: Face Detection (Completed) */}
            <div className="relative flex items-center justify-center">
              <div className="relative z-10 flex items-center gap-4 bg-surface-dark border border-white/10 px-5 py-3 rounded-xl backdrop-blur-md">
                <div className="flex items-center justify-center size-8 rounded-full bg-white/10 text-white/60">
                  <span className="material-symbols-outlined text-lg">face</span>
                </div>
                <span className="text-sm font-medium text-white/60">Face Detection</span>
                <span className="absolute -right-1 -top-1 size-3 bg-green-500 rounded-full border-2 border-dark-void"></span>
              </div>
            </div>

            {/* Node 4: Face Matching (ACTIVE) */}
            <div className="relative flex items-center justify-center scale-110 transition-transform">
              {/* Data Pulse Ring */}
              <div className="absolute inset-0 rounded-xl border border-primary opacity-50 animate-ping"></div>
              
              {/* Tooltip */}
              <div className="absolute -right-32 top-1/2 -translate-y-1/2 bg-surface-dark/90 border border-white/10 p-2 rounded-lg backdrop-blur-xl shadow-xl flex flex-col z-20">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Confidence</span>
                <span className="text-sm font-bold text-primary">98.4%</span>
              </div>

              {/* Active Node Body */}
              <div className="relative z-10 flex items-center gap-4 bg-[#1a120b] border-2 border-primary px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(255,121,26,0.2)] node-glow-active">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary text-white">
                  <span className="material-symbols-outlined text-xl">how_to_reg</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-white">Face Matching</span>
                  <span className="text-xs text-primary font-medium animate-pulse">Processing...</span>
                </div>
              </div>
            </div>

            {/* Node 5: Result (Pending) */}
            <div className="relative flex items-center justify-center opacity-50">
              <div className="relative z-10 flex items-center gap-4 bg-surface-dark border border-white/5 px-5 py-3 rounded-xl backdrop-blur-sm grayscale">
                <div className="flex items-center justify-center size-8 rounded-full bg-white/5 text-white/40">
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                </div>
                <span className="text-sm font-medium text-white/40">Verification Result</span>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Playback Controls */}
        <div className="absolute bottom-60 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-full glass-panel border border-white/10 shadow-lg">
          <button className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-white transition-colors">
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center size-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined filled">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          <button className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-white transition-colors">
            <span className="material-symbols-outlined">fast_forward</span>
          </button>
        </div>

        {/* Detail Modal (Bottom Sheet) */}
        <div className="absolute bottom-0 left-0 w-full z-40 flex flex-col justify-end">
          {/* Backdrop Gradient */}
          <div className="h-24 w-full bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
          <div className="relative flex flex-col items-stretch bg-[#1a120b] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
            
            {/* Drag Handle */}
            <button className="relative z-10 flex h-6 w-full items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
            </button>

            <div className="relative z-10 flex-1 px-6 pb-8 pt-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white tracking-tight text-2xl font-bold leading-tight">Face Matching</h2>
                  <p className="text-white/40 text-sm mt-1 font-mono">ID: proc_8291a_x99</p>
                </div>
                {/* Thumbnail */}
                <div className="size-12 rounded-lg bg-gray-800 border border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-700 to-gray-600"></div>
                  <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-3xl">face</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white/5 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-lg">percent</span>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Similarity</p>
                  </div>
                  <p className="text-white tracking-tight text-3xl font-bold leading-none">98.4<span className="text-lg text-white/40">%</span></p>
                </div>
                <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white/5 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 delay-75"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-lg">timer</span>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Latency</p>
                  </div>
                  <p className="text-white tracking-tight text-3xl font-bold leading-none">120<span className="text-lg text-white/40">ms</span></p>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="bg-black/40 rounded-lg border border-white/5 p-4 font-mono text-xs text-blue-300 overflow-x-auto">
                <div className="flex gap-2 mb-2 border-b border-white/5 pb-2">
                  <span className="text-white/40">JSON Output</span>
                </div>
                <pre className="leading-relaxed"><span className="text-purple-400">"match_result"</span>: {`{`}
  <span className="text-green-400">"verified"</span>: <span className="text-primary">true</span>,
  <span className="text-green-400">"confidence"</span>: <span className="text-yellow-300">0.9842</span>,
  <span className="text-green-400">"bbox"</span>: [<span className="text-orange-300">120</span>, <span className="text-orange-300">45</span>, <span className="text-orange-300">320</span>, <span className="text-orange-300">245</span>]
{`}`}</pre>
              </div>

              {/* Action Button */}
              <button className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-primary text-white font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <span>View Full Log</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPipeline;
