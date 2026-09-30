'use client';
import { useEffect, useState } from 'react';

export default function Astronaut() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '-20%',
      right: '20%',
      pointerEvents: 'none',
      zIndex: 1,
      animation: 'float-astronaut 45s ease-in-out infinite alternate',
      filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.3))'
    }}>
      <style>{`
        @keyframes float-astronaut {
          0% { transform: translate(0, 0) rotate(-10deg) scale(0.8); }
          50% { transform: translate(-30vw, -60vh) rotate(15deg) scale(1); }
          100% { transform: translate(-15vw, -110vh) rotate(-5deg) scale(0.7); }
        }
      `}</style>
      <svg width="120" height="160" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tether/Cord */}
        <path d="M 30 45 Q 10 70 -50 40" stroke="rgba(157, 78, 221, 0.6)" strokeWidth="1" fill="none" strokeDasharray="2 2"/>
        
        {/* Backpack */}
        <rect x="8" y="20" width="44" height="40" rx="6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
        
        {/* Body */}
        <rect x="15" y="30" width="30" height="35" rx="8" stroke="rgba(0, 245, 255, 0.8)" strokeWidth="1.5" fill="rgba(0, 245, 255, 0.05)"/>
        
        {/* Helmet Base */}
        <circle cx="30" cy="20" r="14" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="rgba(15,12,35,0.9)"/>
        
        {/* Visor Reflection */}
        <path d="M 22 18 Q 30 12 38 18 Q 30 26 22 18" fill="rgba(0, 245, 255, 0.3)"/>
        <path d="M 25 16 Q 30 14 35 16" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        
        {/* Left Arm */}
        <path d="M 15 35 Q -5 45 10 55" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        
        {/* Right Arm (Waving) */}
        <path d="M 45 35 Q 55 20 48 10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        
        {/* Left Leg */}
        <path d="M 22 65 Q 18 75 15 85" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        
        {/* Right Leg */}
        <path d="M 38 65 Q 42 75 45 80" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        
        {/* Tech Details */}
        <circle cx="30" cy="45" r="4" stroke="rgba(157, 78, 221, 0.8)" strokeWidth="1" fill="none"/>
        <line x1="20" y1="38" x2="25" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <line x1="20" y1="42" x2="23" y2="42" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
      </svg>
    </div>
  );
}
