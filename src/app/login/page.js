'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [teamCode, setTeamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      const codeStr = teamCode.trim();
      if (codeStr) {
        router.push(`/team?id=${encodeURIComponent(codeStr)}`);
      } else {
        alert('Please enter a valid mission code');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', background: 'rgba(15, 12, 35, 0.85)' }}>
        <h2 className="neon-text-blue" style={{ textAlign: 'center', marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>Starfleet Access</h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>MISSION CODE</label>
            <input 
              type="text" 
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              className="glow-border-blue"
              placeholder="e.g. ORION-7"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(5, 2, 15, 0.8)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
              required
            />
          </div>
          
          <button type="submit" className="cyber-button" style={{ marginTop: '20px' }} disabled={isLoading}>
            {isLoading ? 'Calibrating Warp Drive...' : 'Launch Mission'}
          </button>
        </form>
      </div>
    </div>
  );
}
