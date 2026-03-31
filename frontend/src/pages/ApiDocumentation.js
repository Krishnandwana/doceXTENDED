import React from 'react';

const ApiDocumentation = () => {
  return (
    <div className="dark min-h-screen bg-background-dark text-white font-display antialiased overflow-hidden relative flex items-center justify-center">
      <div className="fixed inset-0 z-0 bg-grid-pattern pointer-events-none"></div>
      <div className="glow-orb top-[-50px] left-[-50px]"></div>
      <div className="glow-orb bottom-[15%] right-[-100px]" style={{ animationDelay: '-4s' }}></div>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[0.14em] uppercase text-primary glow-text">
          Coming Soon
        </h1>
      </div>
    </div>
  );
};

export default ApiDocumentation;
