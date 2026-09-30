'use client';

export default function LeaderboardPreview({ teams }) {
  // Assuming teams is sorted by rank
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h3 className="neon-text-blue" style={{ marginBottom: '16px' }}>Live Standings</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {teams.map((team, idx) => (
          <div key={team.id} style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 60px',
            gap: '10px',
            padding: '12px',
            background: idx === 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: idx === 0 ? '1px solid var(--accent-blue)' : '1px solid transparent',
            borderRadius: '8px',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? '#cd7f32' : 'var(--text-secondary)'
            }}>
              #{team.rank}
            </div>
            <div style={{ fontWeight: idx === 0 ? 'bold' : 'normal' }}>
              {team.name}
            </div>
            <div style={{ textAlign: 'right', color: 'var(--accent-green)', fontWeight: 'bold' }}>
              <span className="meteor-icon">☄️</span>{team.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
