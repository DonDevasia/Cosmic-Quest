'use client';
import { useState, useEffect, useRef } from 'react';

export default function CaptchaTask({ onSuccess }) {
  const [captchaString, setCaptchaString] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [chars, setChars] = useState([]);

  const generateCaptcha = () => {
    const charsList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newString = '';
    const newChars = [];

    for (let i = 0; i < 6; i++) {
      const char = charsList.charAt(Math.floor(Math.random() * charsList.length));
      newString += char;
      
      // Generate random positions, rotations, and sizes to scatter them
      newChars.push({
        id: i,
        char: char,
        left: Math.floor(Math.random() * 80) + '%', // Keep within 0-80% to avoid overflow
        top: Math.floor(Math.random() * 70) + '%',
        rotate: Math.floor(Math.random() * 90) - 45, // -45 to 45 degrees
        size: Math.floor(Math.random() * 1.5) + 1.5, // 1.5rem to 3rem
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)` // Random vibrant color
      });
    }

    setCaptchaString(newString);
    setChars(newChars);
    setUserInput('');
    setError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.toUpperCase() === captchaString) {
      setError('');
      if (onSuccess) {
        onSuccess('CAPTCHA_SOLVED');
      }
    } else {
      setError('Invalid sequence detected. Security matrix reset.');
      generateCaptcha(); // Regenerate on failure
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>HUMAN VERIFICATION REQUIRED</h3>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Identify and enter the characters scattered in the matrix below.
      </p>

      {/* Captcha Display Area */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '300px', 
        height: '200px', 
        margin: '0 auto 20px auto', 
        background: 'rgba(0, 240, 255, 0.05)', 
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.1)'
      }}>
        {/* Background noise grid */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.5
        }} />

        {/* Characters */}
        {chars.map(c => (
          <span key={c.id} style={{
            position: 'absolute',
            left: c.left,
            top: c.top,
            transform: `rotate(${c.rotate}deg)`,
            fontSize: `${c.size}rem`,
            color: c.color,
            fontWeight: 'bold',
            fontFamily: 'var(--font-mono)',
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
            userSelect: 'none',
            zIndex: 2
          }}>
            {c.char}
          </span>
        ))}
        
        {/* Foreground noise lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {[...Array(5)].map((_, i) => (
            <line 
              key={i} 
              x1={`${Math.random() * 100}%`} 
              y1={`${Math.random() * 100}%`} 
              x2={`${Math.random() * 100}%`} 
              y2={`${Math.random() * 100}%`} 
              stroke={`rgba(255, 255, 255, 0.2)`} 
              strokeWidth={Math.random() * 3 + 1} 
            />
          ))}
        </svg>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <input 
          type="text" 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          placeholder="ENTER SEQUENCE..." 
          style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
          maxLength={6}
          required
        />
        {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{error}</p>}
        
        <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px' }}>
          VERIFY IDENTITY
        </button>
      </form>
      
      <button 
        onClick={generateCaptcha} 
        style={{ marginTop: '15px', background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
      >
        Regenerate Sequence
      </button>
    </div>
  );
}
