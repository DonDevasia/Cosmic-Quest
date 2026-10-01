'use client';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('cosmic_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // THE ADMIN PASSWORD IS HERE
    if (passwordInput === 'cosmic2024') { 
      localStorage.setItem('cosmic_admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      alert('ACCESS DENIED: Incorrect Override Code');
      setPasswordInput('');
    }
  };

  if (!isMounted) return null; // Avoid hydration mismatch

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', backgroundColor: 'var(--bg-dark)', color: 'white', fontFamily: 'var(--font-mono)' }}>
        <div style={{ padding: '40px', background: 'rgba(0,0,0,0.8)', border: '1px solid var(--accent-red)', borderRadius: '10px', textAlign: 'center', boxShadow: '0 0 20px rgba(255, 51, 102, 0.2)' }}>
          <h1 style={{ color: 'var(--accent-red)', marginBottom: '10px', textShadow: '0 0 10px rgba(255,51,102,0.5)' }}>RESTRICTED ADMIN AREA</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontStyle: 'italic' }}>Please enter the command center override code.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '350px', margin: '0 auto' }}>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Enter Password..." 
              style={{ 
                padding: '15px', 
                background: 'rgba(255,0,0,0.05)', 
                border: '1px solid var(--accent-red)', 
                color: 'white',
                fontSize: '1.2rem',
                textAlign: 'center',
                outline: 'none',
                letterSpacing: '5px'
              }} 
            />
            <button type="submit" className="cyber-button" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', fontSize: '1.1rem', padding: '15px' }}>
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
