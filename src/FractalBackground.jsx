import React from 'react';

export default function FractalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1, opacity: 0.8 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black/50 to-purple-900/30 animate-pulse" style={{ animationDuration: '15s' }}></div>
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-white/5 animate-pulse"
            style={{
              width: `${Math.random() * 20 + 5}px`,
              height: `${Math.random() * 20 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>
      <style
        /* eslint-disable react/no-danger */
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0.2; }
        }
        `,
        }}
      />
    </div>
  );
}
