'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [loginType, setLoginType] = useState('team'); // 'team' or 'admin'
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Placeholder login logic for demonstration
    setTimeout(() => {
      if (loginType === 'admin') {
        // In real app: Supabase Admin Auth
        if (loginId === 'admin' && password === 'admin') {
          router.push('/admin');
        } else {
          alert('Invalid admin credentials');
          setIsLoading(false);
        }
      } else {
        // In real app: Supabase lookup in 'teams' table by team_code
        if (teamCode) {
          router.push(`/team?id=${encodeURIComponent(teamCode)}`);
        } else {
          alert('Please enter a team code');
          setIsLoading(false);
        }
      }
    }, 1000);
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 className="neon-text-blue" style={{ textAlign: 'center', marginBottom: '20px' }}>System Access</h2>
        
        {/* Toggle Login Type */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <button 
            type="button"
            className="cyber-button"
            style={{ 
              flex: 1, 
              background: loginType === 'team' ? 'linear-gradient(45deg, rgba(0, 240, 255, 0.3), rgba(157, 78, 221, 0.3))' : '',
              borderColor: loginType === 'team' ? 'var(--accent-blue)' : 'var(--glass-border)'
            }}
            onClick={() => setLoginType('team')}
          >
            TEAM
          </button>
          <button 
            type="button"
            className="cyber-button"
            style={{ 
              flex: 1, 
              background: loginType === 'admin' ? 'linear-gradient(45deg, rgba(0, 240, 255, 0.3), rgba(157, 78, 221, 0.3))' : '',
              borderColor: loginType === 'admin' ? 'var(--accent-purple)' : 'var(--glass-border)'
            }}
            onClick={() => setLoginType('admin')}
          >
            ADMIN
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {loginType === 'team' ? (
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
          ) : (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>ADMIN USERNAME</label>
                <input 
                  type="text" 
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="glow-border-purple"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '4px',
                    color: 'white',
                    fontFamily: 'var(--font-mono)'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>PASSWORD</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glow-border-purple"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '4px',
                    color: 'white',
                    fontFamily: 'var(--font-mono)'
                  }}
                  required
                />
              </div>
            </>
          )}
          
          <button type="submit" className="cyber-button" style={{ marginTop: '20px' }} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Initialize Connection'}
          </button>
        </form>
      </div>
    </div>
  );
}
