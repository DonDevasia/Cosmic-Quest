'use client';
import Link from 'next/link';

export default function Navbar({ title, subtitle, score, rank }) {
  return (
    <nav className="glass-panel" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 24px',
      marginBottom: '24px',
      position: 'sticky',
      top: '20px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '8px', 
          background: 'linear-gradient(45deg, var(--accent-blue), var(--accent-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '900',
          color: '#fff',
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
        }}>TH</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }} className="neon-text-blue">{title}</h2>
          {subtitle && <p style={{ margin: 0, fontSize: '0.8rem' }} className="text-secondary">{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {rank !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RANK</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className="neon-text-purple">#{rank}</div>
          </div>
        )}
        
        {score !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SCORE</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{score}</div>
          </div>
        )}

        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="cyber-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            Logout
          </button>
        </Link>
      </div>
    </nav>
  );
}
