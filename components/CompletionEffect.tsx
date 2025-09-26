import React from 'react';

const CompletionEffect: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center">
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-glow 3s ease-in-out forwards'
        }}
      />
      
      {/* Scanline */}
      <div 
        className="absolute left-0 right-0 h-1/2"
        style={{ animation: 'scanline-sweep 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
      >
        <div className="w-full h-full" style={{
          background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.4) 50%, rgba(0, 255, 255, 0) 100%)',
          boxShadow: '0 0 15px 5px rgba(0, 255, 255, 0.5)'
        }} />
      </div>

      {/* Text */}
      <h2 className="text-5xl md:text-8xl font-mono uppercase tracking-widest text-cyan-300 opacity-0"
            style={{ 
              textShadow: '0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff',
              animation: 'text-glitch 3.5s ease-in-out 0.5s forwards'
            }}>
        
      </h2>
    </div>
  );
};

export default CompletionEffect;
