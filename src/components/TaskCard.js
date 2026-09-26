'use client';

export default function TaskCard({ taskNumber, title, status, points }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Locked': return 'var(--text-secondary)';
      case 'Available': return 'var(--accent-blue)';
      case 'In Progress': return 'var(--accent-purple)';
      case 'Submitted': return 'var(--accent-cyan)';
      case 'Completed': return 'var(--accent-green)';
      case 'Failed': return 'var(--accent-red)';
      default: return 'var(--text-primary)';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Locked': return '🔒';
      case 'Available': return '🔓';
      case 'In Progress': return '⏳';
      case 'Completed': return '✓';
      case 'Failed': return '✗';
      default: return '●';
    }
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderLeft: `4px solid ${getStatusColor(status)}`,
      background: status === 'Locked' ? 'rgba(0,0,0,0.8)' : 'var(--bg-surface)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '1.5rem', color: getStatusColor(status) }}>
          {getStatusIcon(status)}
        </div>
        <div>
          <h4 style={{ margin: 0, color: status === 'Locked' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
            Task {String(taskNumber).padStart(2, '0')}: {title}
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: getStatusColor(status) }}>{status}</p>
        </div>
      </div>
      {points > 0 && (
        <div style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>+{points} pts</div>
      )}
    </div>
  );
}
