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
    
    // Placeholder login logic for demonstration
    setTimeout(() => {
      // In real app: Supabase lookup in 'teams' table by team_code
      if (teamCode) {
        router.push(`/team?id=${encodeURIComponent(teamCode)}`);
      } else {
        alert('Please enter a team code');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 className="neon-text-blue" style={{ textAlign: 'center', marginBottom: '20px' }}>System Access</h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>TEAM CODE</label>
            <input 
              type="text" 
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              className="glow-border-blue"
              placeholder="e.g. A7X9Q2"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: 'white',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
              required
            />
          </div>
          
          <button type="submit" className="cyber-button" style={{ marginTop: '20px' }} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Initialize Connection'}
          </button>
        </form>
      </div>
    </div>
  );
}
