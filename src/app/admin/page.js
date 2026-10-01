'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LeaderboardPreview from '@/components/LeaderboardPreview';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamNum, setNewTeamNum] = useState(1);
  const [newTeamCode, setNewTeamCode] = useState('');
  const [memberA, setMemberA] = useState('');
  const [memberB, setMemberB] = useState('');
  const [memberC, setMemberC] = useState('');
  const [memberD, setMemberD] = useState('');
  const [teams, setTeams] = useState([]); // Start completely empty
  const [eventTimeLeft, setEventTimeLeft] = useState(7200); // Default 2 hours in seconds
  const [isEventRunning, setIsEventRunning] = useState(false);
  const [eventStartTime, setEventStartTime] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [selectedTeamForScore, setSelectedTeamForScore] = useState('');

  // Fetch teams from DB and subscribe to live changes
  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_tasks (
            status,
            is_active,
            tasks ( title )
          )
        `)
        .order('total_score', { ascending: false });
        
      if (!error && data) {
        const mapped = data.map((t, idx) => {
          const activeTask = t.team_tasks?.find(tt => tt.is_active);
          const completedTasksRaw = t.team_tasks?.filter(tt => tt.status === 'Completed') || [];
          const completedCount = completedTasksRaw.length;
          const completedNames = completedTasksRaw.map(tt => tt.tasks?.title).filter(Boolean).join(', ');
          
          return {
            id: t.id,
            rank: idx + 1,
            name: t.team_name,
            score: t.total_score,
            status: t.is_locked ? 'Locked' : 'Active',
            code: t.team_code,
            memberA: t.member_a,
            memberB: t.member_b,
            memberC: t.member_c,
            memberD: t.member_d,
            currentDirective: activeTask?.tasks?.title || 'None',
            completedTasks: completedCount,
            completedTasksList: completedNames
          };
        });
        setTeams(mapped);
      }
    };

    const fetchVerifications = async () => {
      const { data, error } = await supabase
        .from('team_tasks')
        .select(`
          task_id,
          team_id,
          status,
          submission_payload,
          teams (team_name),
          tasks (title)
        `)
        .eq('status', 'Submitted');
        
      if (!error && data) {
        setVerifications(data.map(v => ({
          teamId: v.team_id,
          taskId: v.task_id,
          teamName: v.teams.team_name,
          taskTitle: v.tasks.title,
          payload: v.submission_payload
        })));
      }
    };

    fetchTeams();
    fetchVerifications();

    const teamsSubscription = supabase
      .channel('public:teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();
      
    const tasksSubscription = supabase
      .channel('public:team_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_tasks' }, () => {
        fetchVerifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(teamsSubscription);
      supabase.removeChannel(tasksSubscription);
    };
  }, []);

  // Fetch Event State and sync timer
  useEffect(() => {
    const fetchEventState = async () => {
      const { data, error } = await supabase
        .from('event_state')
        .select('*')
        .limit(1)
        .single();
        
      if (!error && data) {
        setIsEventRunning(data.is_active && data.timer_running);
        if (data.is_active && data.start_time) {
          setEventStartTime(data.start_time);
          // Calculate remaining time instantly
          const elapsed = Math.floor((Date.now() - new Date(data.start_time).getTime()) / 1000);
          const remaining = Math.max(0, data.total_duration_seconds - elapsed);
          setEventTimeLeft(remaining);
        } else {
          setEventTimeLeft(data.total_duration_seconds || 7200);
          setEventStartTime(null);
        }
      }
    };

    fetchEventState();
  }, []);

  // Sync Timer every second to prevent drift and background tab throttling
  useEffect(() => {
    let timerId;
    if (isEventRunning && eventStartTime) {
      timerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(eventStartTime).getTime()) / 1000);
        setEventTimeLeft(Math.max(0, 7200 - elapsed));
      }, 1000);
    }
    
    return () => clearInterval(timerId);
  }, [isEventRunning, eventStartTime]);

  // Format time (seconds to HH:MM:SS)
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStartEvent = async () => {
    try {
      const res = await fetch('/api/admin/start-event', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsEventRunning(true);
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (err) {
      alert('Error starting event');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/create-team', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: newTeamName, 
          teamNumber: newTeamNum, 
          teamCode: newTeamCode,
          memberA, memberB, memberC, memberD
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Team Created! The login code is: ${data.team.team_code}`);
        // Add to local state so it appears in the table immediately
        setTeams([...teams, {
          id: data.team.id || Date.now(), // Use real ID if connected, else fallback for mock
          rank: teams.length + 1,
          name: data.team.team_name,
          score: 0,
          status: 'Offline',
          code: data.team.team_code,
          memberA: data.team.member_a,
          memberB: data.team.member_b,
          memberC: data.team.member_c,
          memberD: data.team.member_d
        }]);
        setNewTeamName('');
        setNewTeamCode('');
        setMemberA('');
        setMemberB('');
        setMemberC('');
        setMemberD('');
        setNewTeamNum(newTeamNum + 1);
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (err) {
      alert('Error creating team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      const res = await fetch('/api/admin/delete-team', { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });
      
      const data = await res.json();
      if (!data.success) {
        alert('Warning: Failed to delete team from database.');
      }
      
      // Remove from local state
      setTeams(teams.filter(t => t.id !== teamId));
    } catch (err) {
      alert('Error deleting team');
    }
  };

  const handleResetEvent = async () => {
    if (confirm('Are you sure you want to RESET the entire event? This will delete all teams.')) {
      try {
        await fetch('/api/admin/reset-event', { method: 'POST' });
        setTeams([]);
        setNewTeamNum(1);
        localStorage.removeItem('mockTeams');
        alert('Event and Database have been reset.');
      } catch (err) {
        alert('Error resetting database');
      }
    }
  };

  const handleVerifyTask = async (teamId, taskId, action) => {
    let feedback = '';
    if (action === 'reject') {
      feedback = prompt('Enter rejection reason (optional):') || 'Rejected by Admin';
    }

    try {
      const res = await fetch('/api/admin/verify-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, taskId, action, feedback })
      });
      const data = await res.json();
      if (!data.success) {
        alert('Failed to verify: ' + data.message);
      }
    } catch (err) {
      alert('Error verifying task');
    }
  };

  const handleQuickScore = async (pointsChange) => {
    if (!selectedTeamForScore) {
      alert('Please select a team first');
      return;
    }
    try {
      const res = await fetch('/api/admin/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamForScore,
          taskId: null,
          pointsChange,
          reason: 'Admin Quick Score'
        })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic UI update will happen via Supabase realtime subscription
        alert(data.message);
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (err) {
      alert('Error updating score');
    }
  };

  const handleForceCompleteTask = async () => {
    if (!selectedTeamForScore) {
      alert('Please select a team first');
      return;
    }
    if (!confirm("Are you sure you want to FORCE COMPLETE this team's currently active task? This will award them base points and move them to the next task.")) {
      return;
    }

    try {
      // 1. Get the team's currently active task
      const res1 = await fetch('/api/admin/force-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamForScore })
      });
      const data1 = await res1.json();
      
      if (!data1.success) {
        alert(data1.message);
        return;
      }

      // 2. Submit the task with admin override
      const res2 = await fetch('/api/team/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId: selectedTeamForScore, 
          taskId: data1.taskId, 
          adminOverride: true 
        })
      });
      
      const data2 = await res2.json();
      if (data2.success) {
        alert('Task Successfully Force Completed!');
      } else {
        alert('Failed: ' + data2.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error force completing task');
    }
  };

  const handleTestTask = async (taskId) => {
    try {
      const res = await fetch('/api/admin/test-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskNumber: taskId })
      });
      const data = await res.json();
      if (data.success) {
        window.open(`/team?id=${data.teamCode}`, '_blank');
      } else {
        alert('Failed to launch test: ' + data.message);
      }
    } catch (err) {
      alert('Error launching test mode');
    }
  };

  const handleOpenLogs = () => {
    window.open('/admin/logs', '_blank');
  };

  return (
    <div className="container">
      <Navbar title="Fleet Command Center" subtitle="Cosmic Mission Control" />
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['overview', 'teams', 'tasks', 'scores', 'verifications'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="cyber-button"
            style={{ 
              background: activeTab === tab ? 'linear-gradient(45deg, rgba(0, 240, 255, 0.3), rgba(157, 78, 221, 0.3))' : '',
              borderColor: activeTab === tab ? 'var(--accent-blue)' : 'var(--glass-border)'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
        <button 
          onClick={handleOpenLogs}
          className="cyber-button"
          style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
        >
          VIEW LOGS
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: '1 1 60%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {activeTab === 'overview' && (
            <div className="glass-panel animate-slide-up" style={{ padding: '30px' }}>
              <h3 className="neon-text-blue" style={{ marginBottom: '20px' }}>Global Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>TOTAL TEAMS</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{teams.length}</p>
                </div>
                
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>EVENT TIME</p>
                  <p className="neon-text-blue" style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                    {formatTime(eventTimeLeft)}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button className="cyber-button" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Pause</button>
                    <button onClick={handleResetEvent} className="cyber-button" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: 'var(--accent-red)', color: 'var(--text-secondary)' }}>Reset</button>
                    <button onClick={handleStartEvent} className="cyber-button" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>INITIATE FLEET LAUNCH</button>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>CURRENT LEADER</p>
                  <p className="neon-text-purple" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {teams.length > 0 ? teams[0].name : 'No Teams'}
                  </p>
                </div>
                
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="glass-panel animate-slide-up" style={{ padding: '30px', background: 'rgba(0, 240, 255, 0.05)' }}>
                <h3 className="neon-text-blue" style={{ marginBottom: '20px' }}>Create New Team</h3>
                <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>TEAM NAME</label>
                    <input 
                      type="text" 
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="glow-border-blue"
                      placeholder="e.g. Apollo Vanguard"
                      style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>TEAM CODE</label>
                    <input 
                      type="text" 
                      value={newTeamCode}
                      onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
                      className="glow-border-blue"
                      placeholder="e.g. TEAM1"
                      style={{ width: '120px', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white', textTransform: 'uppercase' }}
                      required
                    />
                  </div>
                  

                  <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="cyber-button" style={{ height: '40px', padding: '0 30px' }}>Create Team</button>
                  </div>
                </form>
              </div>

              <div className="glass-panel animate-slide-up" style={{ padding: '30px' }}>
                <h3 className="neon-text-blue" style={{ marginBottom: '20px' }}>Team Management</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px' }}>Rank</th>
                        <th style={{ padding: '10px' }}>Team</th>
                        <th style={{ padding: '10px' }}>Login Code</th>
                        <th style={{ padding: '10px' }}>Score</th>
                        <th style={{ padding: '10px' }}>Current Directive</th>
                        <th style={{ padding: '10px' }}>Completed</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No teams generated yet. Use the form above to create teams.
                          </td>
                        </tr>
                      ) : (
                        teams.map(team => (
                          <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px' }}>#{team.rank}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{team.name}</td>
                            <td style={{ padding: '10px', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>{team.code}</td>
                            <td style={{ padding: '10px', color: 'var(--accent-green)' }}><span className="meteor-icon">☄️</span>{team.score}</td>
                            <td style={{ padding: '10px', color: 'var(--accent-cyan)' }}>{team.currentDirective}</td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ fontWeight: 'bold' }}>{team.completedTasks} / 14</div>
                              <div 
                                style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                                title={team.completedTasksList}
                              >
                                {team.completedTasksList || 'None yet'}
                              </div>
                            </td>
                            <td style={{ padding: '10px', color: team.status === 'Active' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>{team.status}</td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                 <button className="cyber-button" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Edit</button>
                                 <button onClick={() => handleDeleteTeam(team.id)} className="cyber-button" style={{ padding: '4px 10px', fontSize: '0.7rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'tasks' && (
             <div className="glass-panel animate-slide-up" style={{ padding: '30px' }}>
                <h3 className="neon-text-blue" style={{ marginBottom: '20px' }}>Directive Masterlist</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {[
                    { id: 1, title: 'Akinator Game', points: 100, status: 'Locked' },
                    { id: 2, title: 'QR Scanner', points: 100, status: 'Locked' },
                    { id: 3, title: 'Thugwar', points: 100, status: 'Locked' },
                    { id: 4, title: 'Object Scanner', points: 100, status: 'Locked' },
                    { id: 5, title: 'Wordle', points: 150, status: 'Locked' },
                    { id: 6, title: 'Convince Me', points: 150, status: 'Locked' },
                    { id: 7, title: 'Dictionary Game', points: 200, status: 'Locked' },
                    { id: 8, title: 'Morse Code', points: 200, status: 'Locked' },
                    { id: 9, title: 'Bottle Counting', points: 100, status: 'Locked' },
                    { id: 10, title: 'TANGRAM', points: 100, status: 'Locked' },
                    { id: 11, title: 'Phase 2 - QR 1', points: 200, status: 'Locked' },
                    { id: 12, title: 'Phase 2 - QR 2', points: 200, status: 'Locked' },
                    { id: 13, title: 'Phase 2 - QR 3', points: 200, status: 'Locked' },
                    { id: 14, title: 'Phase 2 - Final Destination', points: 500, status: 'Locked' }
                  ].map(task => (
                    <div key={task.id} style={{ padding: '15px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DIRECTIVE {task.id < 10 ? `0${task.id}` : task.id}</span>
                        <span style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 'bold' }}>{task.points} PTS</span>
                      </div>
                      <h4 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{task.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: task.status === 'Locked' ? 'var(--text-secondary)' : 'var(--accent-cyan)' }}>{task.status}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleTestTask(task.id)} className="cyber-button" style={{ padding: '2px 8px', fontSize: '0.6rem', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>Test</button>
                          <button className="cyber-button" style={{ padding: '2px 8px', fontSize: '0.6rem' }}>Edit</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {activeTab === 'scores' && (
             <div className="glass-panel animate-slide-up" style={{ padding: '30px' }}>
                <h3 className="neon-text-blue" style={{ marginBottom: '20px' }}>Score Control</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>SELECT TEAM</label>
                    <select 
                      className="glow-border-blue" 
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '4px' }}
                      value={selectedTeamForScore}
                      onChange={(e) => setSelectedTeamForScore(e.target.value)}
                    >
                      <option value="">-- Choose a Team --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (Current: {t.score})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>QUICK ADD</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {[5, 10, 20, 50, 100].map(pts => (
                        <button key={pts} onClick={() => handleQuickScore(pts)} className="cyber-button" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>+{pts}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>QUICK DEDUCT</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {[5, 10, 20].map(pts => (
                        <button key={pts} onClick={() => handleQuickScore(-pts)} className="cyber-button" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>-{pts}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--accent-purple)' }}>TASK OVERRIDE</label>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '15px' }}>
                      If a team is stuck or their timer broke, use this to force complete their <strong>currently active task</strong>, award them the points, and auto-assign their next task.
                    </p>
                    <button 
                      onClick={handleForceCompleteTask} 
                      className="cyber-button" 
                      style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', width: '100%', padding: '15px' }}
                    >
                      FORCE COMPLETE ACTIVE TASK
                    </button>
                  </div>

                </div>
             </div>
          )}

          {activeTab === 'verifications' && (
             <div className="glass-panel animate-slide-up" style={{ padding: '30px' }}>
                <h3 className="neon-text-blue" style={{ marginBottom: '20px' }}>Pending Verifications</h3>
                
                {verifications.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No pending verifications at the moment.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {verifications.map((v, i) => (
                      <div key={i} style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-blue)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                          <span style={{ fontWeight: 'bold' }}>{v.teamName}</span>
                          <span style={{ color: 'var(--accent-purple)', fontSize: '0.9rem' }}>{v.taskTitle}</span>
                        </div>
                        
                        {v.payload && v.payload.startsWith('data:image') ? (
                          <img 
                            src={v.payload} 
                            alt="Submission" 
                            style={{ width: '100%', height: 'auto', borderRadius: '4px', marginBottom: '15px', border: '1px solid var(--glass-border)' }} 
                          />
                        ) : (
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '15px', textAlign: 'center', wordBreak: 'break-all' }}>
                            {v.payload || 'No payload'}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => handleVerifyTask(v.teamId, v.taskId, 'approve')}
                            className="cyber-button" 
                            style={{ flex: 1, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                          >
                            APPROVE
                          </button>
                          <button 
                            onClick={() => handleVerifyTask(v.teamId, v.taskId, 'reject')}
                            className="cyber-button" 
                            style={{ flex: 1, borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

        </div>
        
        {/* Sidebar */}
        <div style={{ flex: '1 1 350px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          
          <LeaderboardPreview teams={teams} />
          
        </div>
        
      </div>
    </div>
  );
}
