'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(fetchLogs, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('team_tasks')
        .select(`
          id, assigned_at, started_at, completed_at, status, points_awarded,
          teams(team_name),
          tasks(title)
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Transform raw data into discrete chronological events
      let events = [];

      data.forEach(row => {
        const teamName = row.teams?.team_name || 'Unknown Team';
        const taskName = row.tasks?.title || 'Unknown Task';

        // 1. Assigned Event
        if (row.assigned_at) {
          events.push({
            timestamp: new Date(row.assigned_at),
            team: teamName,
            task: taskName,
            action: 'Assigned',
            detail: `Team deployed to task`,
            rawTime: new Date(row.assigned_at).getTime()
          });
        }

        // 2. Started Event
        if (row.started_at) {
          const travelTimeMs = new Date(row.started_at).getTime() - new Date(row.assigned_at).getTime();
          const travelMins = Math.floor(travelTimeMs / 60000);
          const travelSecs = Math.floor((travelTimeMs % 60000) / 1000);
          
          events.push({
            timestamp: new Date(row.started_at),
            team: teamName,
            task: taskName,
            action: 'Arrived',
            detail: `Reached venue in ${travelMins}m ${travelSecs}s. Timer started.`,
            rawTime: new Date(row.started_at).getTime()
          });
        }

        // 3. Completed Event
        if (row.status === 'Completed' && row.completed_at) {
          let durationStr = 'N/A';
          if (row.started_at) {
            const durationMs = new Date(row.completed_at).getTime() - new Date(row.started_at).getTime();
            const durMins = Math.floor(durationMs / 60000);
            const durSecs = Math.floor((durationMs % 60000) / 1000);
            durationStr = `${durMins}m ${durSecs}s`;
          }

          events.push({
            timestamp: new Date(row.completed_at),
            team: teamName,
            task: taskName,
            action: 'Completed',
            detail: `Task beat in ${durationStr}. +${row.points_awarded} pts.`,
            rawTime: new Date(row.completed_at).getTime()
          });
        }

        // 4. Failed Event
        if (row.status === 'Failed') {
          // If there is no completed_at, we just use assigned_at + 8 mins as a rough proxy for sorting, 
          // or just put it at the current time. But we should try to use completed_at if it exists.
          const failTime = row.completed_at ? new Date(row.completed_at) : new Date(new Date(row.assigned_at).getTime() + 8*60000);
          
          events.push({
            timestamp: failTime,
            team: teamName,
            task: taskName,
            action: 'Failed',
            detail: `Timer expired or task failed.`,
            rawTime: failTime.getTime()
          });
        }
      });

      // Sort all events by timestamp descending (newest first)
      events.sort((a, b) => b.rawTime - a.rawTime);
      
      setLogs(events);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Timestamp', 'Team Name', 'Task', 'Action', 'Details'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const timeStr = log.timestamp.toLocaleString();
      // Escape commas and quotes for CSV
      const row = [
        `"${timeStr}"`,
        `"${log.team}"`,
        `"${log.task}"`,
        `"${log.action}"`,
        `"${log.detail}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmic_quest_logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'Assigned': return 'var(--text-secondary)';
      case 'Arrived': return 'var(--accent-blue)';
      case 'Completed': return 'var(--accent-green)';
      case 'Failed': return 'var(--accent-red)';
      default: return 'white';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Link href="/admin" style={{ color: 'var(--accent-blue)', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>
            &larr; Back to Command Center
          </Link>
          <h1 className="glitch" data-text="GAME LOGS" style={{ margin: 0 }}>GAME LOGS</h1>
        </div>
        <button onClick={downloadCSV} className="cyber-button" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
          DOWNLOAD CSV
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0, 240, 255, 0.1)', borderBottom: '1px solid var(--accent-blue)' }}>
              <th style={{ padding: '15px', color: 'var(--accent-blue)' }}>Timestamp</th>
              <th style={{ padding: '15px', color: 'var(--accent-blue)' }}>Team</th>
              <th style={{ padding: '15px', color: 'var(--accent-blue)' }}>Task</th>
              <th style={{ padding: '15px', color: 'var(--accent-blue)' }}>Action</th>
              <th style={{ padding: '15px', color: 'var(--accent-blue)' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Decrypting Logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No log data found.</td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {log.timestamp.toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{log.team}</td>
                  <td style={{ padding: '15px' }}>{log.task}</td>
                  <td style={{ padding: '15px', color: getActionColor(log.action), fontWeight: 'bold' }}>{log.action}</td>
                  <td style={{ padding: '15px', fontStyle: 'italic', color: '#ccc' }}>{log.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
