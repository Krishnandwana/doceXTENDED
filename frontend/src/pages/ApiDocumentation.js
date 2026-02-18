import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ApiDocumentation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('request');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="dark">
      <div className="bg-background-dark text-white font-display antialiased selection:bg-primary/30 min-h-screen flex flex-col overflow-x-hidden relative">
        {/* Background FX */}
        <div className="fixed inset-0 z-0 bg-grid-pattern pointer-events-none"></div>
        <div className="glow-orb top-[-50px] left-[-50px]"></div>
        <div className="glow-orb bottom-[20%] right-[-100px]" style={{animationDelay: '-5s'}}></div>

        {/* Header */}
        <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md active:bg-white/5"
              >
                <span className="material-symbols-outlined !text-[28px]">menu</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded bg-gradient-to-br from-primary to-orange-900 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-white !text-[20px]">description</span>
                </div>
                <span className="font-bold text-lg tracking-tight hidden sm:block">DocVerify</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden xs:flex h-8 items-center px-3 rounded-full bg-surface-dark border border-white/10 text-xs font-medium text-gray-400">
                v2.1
              </div>
              <button className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5">
                <span className="material-symbols-outlined !text-[24px]">search</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex relative z-10 max-w-7xl mx-auto w-full">
          {/* Left Navigation */}
          <aside className="hidden lg:block w-64 shrink-0 border-r border-white/5 h-[calc(100vh-64px)] overflow-y-auto sticky top-16 py-6 pr-4">
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Getting Started</div>
              <a className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors group" href="#introduction">
                <span className="material-symbols-outlined !text-[20px] group-hover:text-primary transition-colors">info</span>
                Introduction
              </a>
              <a className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors group" href="#authentication">
                <span className="material-symbols-outlined !text-[20px] group-hover:text-primary transition-colors">lock</span>
                Authentication
              </a>
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Resources</div>
              <a className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-white bg-primary/10 rounded-lg relative border-l-2 border-primary" href="#envelopes">
                <span className="material-symbols-outlined !text-[20px] text-primary">mail</span>
                Envelopes
              </a>
              <a className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors group" href="#webhooks">
                <span className="material-symbols-outlined !text-[20px] group-hover:text-primary transition-colors">webhook</span>
                Webhooks
              </a>
              <a className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors group" href="#recipients">
                <span className="material-symbols-outlined !text-[20px] group-hover:text-primary transition-colors">group</span>
                Recipients
              </a>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 py-6 px-4 md:px-8 pb-20">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-gray-500 mb-6 gap-2">
              <span>Resources</span>
              <span className="material-symbols-outlined !text-[14px]">chevron_right</span>
              <span className="text-gray-300">Envelopes</span>
            </nav>

            {/* Endpoint Header */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Create Envelope</h1>
                <span className="hidden md:inline-flex size-2 bg-primary rounded-full animate-pulse"></span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wide">
                  POST
                </span>
                <code className="font-mono text-sm text-gray-300 bg-surface-dark px-3 py-1 rounded-md border border-white/10 select-all">/v2/envelopes</code>
              </div>
              <p className="text-gray-400 text-base leading-relaxed max-w-2xl">
                Creates a new signing envelope from a template. This endpoint initiates the document signing process and sends emails to all specified recipients.
              </p>
            </div>

            {/* Interactive Tabs */}
            <div className="border-b border-white/10 mb-6 overflow-x-auto no-scrollbar">
              <div className="flex gap-6 min-w-max">
                <button 
                  onClick={() => setActiveTab('request')}
                  className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'request' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                >
                  Request Body
                </button>
                <button 
                  onClick={() => setActiveTab('response')}
                  className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'response' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                >
                  Response
                </button>
                <button 
                  onClick={() => setActiveTab('playground')}
                  className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'playground' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                >
                  Playground
                  <span className="material-symbols-outlined !text-[14px]">science</span>
                </button>
              </div>
            </div>

            {/* Code Block */}
            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#0d0905] shadow-2xl mb-10">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex gap-2">
                  <span className="size-3 rounded-full bg-red-500/20 border border-red-500/50"></span>
                  <span className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
                  <span className="size-3 rounded-full bg-green-500/20 border border-green-500/50"></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-gray-500">application/json</span>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify({
                      template_id: "tpl_839201_abc",
                      subject: "Please sign the NDA",
                      message: "Kindly review and sign the attached document.",
                      signers: [{ role: "Client", name: "Alice Smith", email: "alice@example.com" }],
                      sandbox_mode: true
                    }, null, 2))}
                    className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined !text-[16px]">content_copy</span>
                    Copy
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm leading-6"><code className="language-json"><span className="text-gray-500">{`{`}</span>
  <span className="text-primary">"template_id"</span><span className="text-gray-400">:</span> <span className="text-green-400">"tpl_839201_abc"</span><span className="text-gray-500">,</span>
  <span className="text-primary">"subject"</span><span className="text-gray-400">:</span> <span className="text-green-400">"Please sign the NDA"</span><span className="text-gray-500">,</span>
  <span className="text-primary">"message"</span><span className="text-gray-400">:</span> <span className="text-green-400">"Kindly review and sign the attached document."</span><span className="text-gray-500">,</span>
  <span className="text-primary">"signers"</span><span className="text-gray-400">:</span> <span className="text-gray-500">[</span>
    <span className="text-gray-500">{`{`}</span>
      <span className="text-primary">"role"</span><span className="text-gray-400">:</span> <span className="text-green-400">"Client"</span><span className="text-gray-500">,</span>
      <span className="text-primary">"name"</span><span className="text-gray-400">:</span> <span className="text-green-400">"Alice Smith"</span><span className="text-gray-500">,</span>
      <span className="text-primary">"email"</span><span className="text-gray-400">:</span> <span className="text-green-400">"alice@example.com"</span>
    <span className="text-gray-500">{`}`}</span>
  <span className="text-gray-500">],</span>
  <span className="text-primary">"sandbox_mode"</span><span className="text-gray-400">:</span> <span className="text-orange-400">true</span>
<span className="text-gray-500">{`}`}</span></code></pre>
              </div>
            </div>

            {/* Parameters */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-white mb-4">Parameters</h3>
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-4 last:border-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-mono text-sm text-primary font-medium">template_id</span>
                    <span className="text-xs text-red-400 border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 rounded">Required</span>
                    <span className="text-xs text-gray-500">string</span>
                  </div>
                  <p className="text-sm text-gray-400">The unique identifier of the template to use.</p>
                </div>
                <div className="border-b border-white/5 pb-4 last:border-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-mono text-sm text-primary font-medium">signers</span>
                    <span className="text-xs text-red-400 border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 rounded">Required</span>
                    <span className="text-xs text-gray-500">array</span>
                  </div>
                  <p className="text-sm text-gray-400">List of recipients who need to sign.</p>
                </div>
              </div>
            </div>

            {/* Error Codes */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Error Codes</h3>
              <div className="space-y-2">
                <details className="group bg-surface-dark border border-white/5 rounded-lg open:border-primary/30 transition-all duration-300">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center size-8 rounded-full bg-red-500/10 text-red-400 font-bold text-xs border border-red-500/20">400</span>
                      <span className="font-medium text-gray-200 text-sm">Bad Request</span>
                    </div>
                    <span className="material-symbols-outlined text-gray-500 group-open:rotate-180 transition-transform duration-300">expand_more</span>
                  </summary>
                  <div className="px-4 pb-4 pt-0 text-sm text-gray-400 border-t border-white/5 mt-2">
                    <p className="pt-2">The request was unacceptable, often due to missing a required parameter.</p>
                    <div className="mt-3 bg-[#0d0905] p-3 rounded border border-white/5">
                      <code className="font-mono text-xs text-red-300">{`{"error": "missing_template_id"}`}</code>
                    </div>
                  </div>
                </details>

                <details className="group bg-surface-dark border border-white/5 rounded-lg open:border-primary/30 transition-all duration-300">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center size-8 rounded-full bg-yellow-500/10 text-yellow-400 font-bold text-xs border border-yellow-500/20">401</span>
                      <span className="font-medium text-gray-200 text-sm">Unauthorized</span>
                    </div>
                    <span className="material-symbols-outlined text-gray-500 group-open:rotate-180 transition-transform duration-300">expand_more</span>
                  </summary>
                  <div className="px-4 pb-4 pt-0 text-sm text-gray-400 border-t border-white/5 mt-2">
                    <p className="pt-2">No valid API key provided.</p>
                  </div>
                </details>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
