'use client';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import WordleTask from '@/components/WordleTask';
import ConvinceMeTask from '@/components/ConvinceMeTask';
import QRScannerTask from '@/components/QRScannerTask';
import ObjectScannerTask from '@/components/ObjectScannerTask';
import DictionaryTask from '@/components/DictionaryTask';


function TeamDashboardContent() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('id'); // Using team_code passed from login
  const playerRole = searchParams.get('role') || 'leader';

  const [team, setTeam] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterTimeLeft, setMasterTimeLeft] = useState(480); // 8 mins max
  const [puzzleTimeLeft, setPuzzleTimeLeft] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);

  const fetchTeamData = useCallback(async () => {
    if (!teamCode) return;
    
    // 1. Get Team UUID from Code
    const { data: teamData, error: teamErr } = await supabase
      .from('teams')
      .select('*')
      .eq('team_code', teamCode)
      .maybeSingle(); // maybeSingle doesn't throw if 0 rows are found
      
    if (teamErr) {
      console.error('Error fetching team:', teamErr);
      setLoading(false);
      return;
    }
    
    if (!teamData) {
      setLoading(false);
      return;
    }
    
    setTeam(teamData);

    // 2. Check Event State
    const { data: eventData } = await supabase
      .from('event_state')
      .select('is_active')
      .limit(1)
      .single();
      
    if (eventData) {
      setIsGameStarted(eventData.is_active);
    }

    // 3. Check for Active Task if Game is Started
    if (eventData?.is_active) {
      await fetchActiveTask(teamData.id);
    }
    
    setLoading(false);
  }, [teamCode]);

  const fetchActiveTask = async (teamId) => {
    const { data: assignment, error } = await supabase
      .from('team_tasks')
      .select(`
        *,
        tasks (title, description, base_points, time_limit_seconds, venue_hint)
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && assignment) {
      const taskData = {
        ...assignment.tasks,
        id: assignment.task_id,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        started_at: assignment.started_at,
        admin_feedback: assignment.admin_feedback,
        time_limit_seconds: assignment.tasks.time_limit_seconds || 480
      };
      // We assume a temporary default puzzle time of 180s (3 minutes) until later configured in DB
      taskData.puzzle_time_seconds = assignment.tasks.puzzle_time_seconds || 180;
      setCurrentTask(taskData);
      
      // Calculate remaining time
      let masterRemaining = 0;
      let puzzleRemaining = null;

      if (assignment.assigned_at) {
        const elapsed = Math.floor((Date.now() - new Date(assignment.assigned_at).getTime()) / 1000);
        masterRemaining = Math.max(0, taskData.time_limit_seconds - elapsed);
      }
      
      if (assignment.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(assignment.started_at).getTime()) / 1000);
        puzzleRemaining = Math.max(0, taskData.puzzle_time_seconds - elapsed);
      }
      
      setMasterTimeLeft(masterRemaining);
      setPuzzleTimeLeft(puzzleRemaining);
    }
  };

  useEffect(() => {
    fetchTeamData();

    // Set up Realtime Subscription for Event State changes
    const eventSubscription = supabase
      .channel('public:event_state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_state' }, (payload) => {
        setIsGameStarted(payload.new.is_active);
        // If event just started and we have a team loaded, fetch their new task
        if (payload.new.is_active) {
          fetchTeamData(); 
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventSubscription);
    };
  }, [fetchTeamData]);

  // Presence Subscription (Lobby)
  useEffect(() => {
    if (!team) return;

    const room = supabase.channel(`team_lobby_${team.id}`);

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState();
        const players = [];
        for (const id in newState) {
          newState[id].forEach(client => {
            players.push(client.role);
          });
        }
        setConnectedPlayers([...new Set(players)]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ role: playerRole });
        }
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [team, playerRole]);

  // Task Countdown Timer and Expiration
  useEffect(() => {
    let timerId;
    if (currentTask && masterTimeLeft > 0) {
      timerId = setInterval(() => {
        let newMaster = 0;
        let newPuzzle = null;
        
        if (currentTask.assigned_at) {
          const masterElapsed = Math.floor((Date.now() - new Date(currentTask.assigned_at).getTime()) / 1000);
          newMaster = Math.max(0, currentTask.time_limit_seconds - masterElapsed);
        }
        
        if (currentTask.started_at) {
          const puzzleElapsed = Math.floor((Date.now() - new Date(currentTask.started_at).getTime()) / 1000);
          newPuzzle = Math.max(0, currentTask.puzzle_time_seconds - puzzleElapsed);
        }

        setMasterTimeLeft(newMaster);
        setPuzzleTimeLeft(newPuzzle);

        const isTaskFinished = currentTask.status === 'Completed' || currentTask.status === 'Submitted';
        const puzzleExpired = !isTaskFinished && newPuzzle !== null && newPuzzle <= 0;

        if (newMaster <= 0 || puzzleExpired) {
          clearInterval(timerId);
          handleTaskExpired();
        }
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [currentTask, masterTimeLeft, puzzleTimeLeft]);

  const handleTaskExpired = async () => {
    try {
      setShowExpiredMessage(true);
      await fetch('/api/team/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, taskId: currentTask.id, isExpired: true, keyword: '' })
      });
      setShowExpiredMessage(false);
      fetchTeamData();
    } catch (err) {
      console.error('Failed to report expiration');
    }
  };

  const startTaskFromQR = async (kw) => {
    setSubmitError('');
    setShowExpiredMessage(false);
    try {
      const res = await fetch('/api/team/start-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, taskId: currentTask.id, keyword: kw.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.message || 'Invalid Venue QR Code');
      } else {
        fetchTeamData();
      }
    } catch (err) {
      setSubmitError('System Error: Connection Failed');
    }
  };

  // Format MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const submitKeywordToAPI = async (kw) => {
    setSubmitError('');
    setShowExpiredMessage(false);
    if (!kw) return;

    try {
      const res = await fetch('/api/team/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, taskId: currentTask.id, keyword: kw.trim() })
      });
      const data = await res.json();
      
      if (data.success) {
        setKeyword('');
        fetchTeamData();
      } else {
        setSubmitError(data.message || 'Access Denied: Invalid Keyword');
      }
    } catch (err) {
      setSubmitError('System Error: Connection Failed');
    }
  };

  const handleSubmitKeyword = async (e) => {
    e.preventDefault();
    await submitKeywordToAPI(keyword);
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}><div className="neon-text-blue animate-pulse">Establishing Secure Connection...</div></div>;
  }

  if (!team) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '100px', color: 'var(--accent-red)' }}>Error: Invalid Team Code or Not Connected to Database</div>;
  }

  return (
    <div className="container">
      <Navbar title={`${team.team_name}`} subtitle="Mission Control" rank="-" score={team.total_score} />
      
      {!isGameStarted ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
          <div className="animate-pulse" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
          <h1 className="neon-text-blue" style={{ fontSize: '3rem', textAlign: 'center' }}>WAITING FOR GAMES TO START</h1>
          <p className="text-secondary" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Please wait for the Admin to initialize the global event...</p>
          
          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '8px', border: '1px solid var(--glass-border)', minWidth: '300px' }}>
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px', textAlign: 'center' }}>TEAM LOBBY</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['leader', 'player2', 'player3', 'player4'].map(r => (
                <li key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <span style={{ color: 'white', textTransform: 'uppercase', fontWeight: 'bold' }}>{r}</span>
                  <span style={{ color: connectedPlayers.includes(r) ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    {connectedPlayers.includes(r) ? 'CONNECTED' : 'WAITING...'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Main Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Current Task & Timer */}
          <div className="glass-panel animate-slide-up" style={{ padding: '40px', textAlign: 'center', background: 'rgba(0, 240, 255, 0.05)' }}>
            <p className="text-secondary" style={{ marginBottom: '10px' }}>CURRENT MISSION</p>
            {currentTask ? (
              <>
                <h2 className="neon-text-blue" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{currentTask.title}</h2>
                
                {/* Timers */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                  {/* Master Timer */}
                  <div>
                    <div className="neon-text-purple" style={{ fontSize: currentTask.started_at ? '2.5rem' : '4rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: masterTimeLeft === 0 ? 'var(--accent-red)' : '' }}>
                      {formatTime(masterTimeLeft)}
                    </div>
                    <p className="text-secondary" style={{ marginTop: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
                      MISSION TIME LIMIT
                    </p>
                  </div>

                  {/* Puzzle Timer */}
                  {currentTask.started_at && puzzleTimeLeft !== null && (
                    <div>
                      <div className="neon-text-blue" style={{ fontSize: '4rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: puzzleTimeLeft === 0 ? 'var(--accent-red)' : '' }}>
                        {formatTime(puzzleTimeLeft)}
                      </div>
                      <p className="text-secondary" style={{ marginTop: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        PUZZLE TIME LIMIT
                      </p>
                    </div>
                  )}
                </div>

                {currentTask.status === 'Assigned' ? (
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-purple)', borderRadius: '8px' }}>
                    {showExpiredMessage && (
                      <div style={{ padding: '15px', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--accent-red)', marginBottom: '5px' }}>TASK EXPIRED</h3>
                        <p style={{ color: 'white', fontSize: '1rem' }}>You ran out of time for the previous task.</p>
                      </div>
                    )}
                    <h3 style={{ color: 'var(--accent-purple)', marginBottom: '10px' }}>TRAVEL TO VENUE</h3>
                    <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '20px' }}>"{currentTask.venue_hint}"</p>
                    
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Scan the Venue QR code at the location to unlock the puzzle.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <QRScannerTask onSuccess={startTaskFromQR} />
                      {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '1.1rem', marginTop: '15px', fontWeight: 'bold' }}>{submitError}</p>}
                    </div>
                  </div>
                ) : currentTask.status === 'Submitted' ? (
                  <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-blue)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--accent-blue)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
                    <h3 style={{ color: 'var(--accent-blue)', marginBottom: '10px' }}>UPLOADING TO MAINFRAME...</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Awaiting manual verification from the Administrator.</p>
                  </div>
                ) : currentTask.status === 'Completed' ? (
                  <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-green)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--accent-green)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
                    <h3 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>WAITING FOR NEXT TASK</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Good job! You completed the task before time. Please wait for the timer to expire to receive your next mission.</p>
                  </div>
                ) : (!currentTask.required_role || currentTask.required_role === 'all' || currentTask.required_role === playerRole) ? (
                  <>
                    {/* Rejection Feedback */}
                    {currentTask.admin_feedback && currentTask.status === 'In Progress' && (
                      <div style={{ padding: '15px', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--accent-red)', marginBottom: '5px' }}>SCAN REJECTED</h3>
                        <p style={{ color: 'white', fontSize: '1rem' }}>{currentTask.admin_feedback}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '10px' }}>Please try again. The timer is still running!</p>
                      </div>
                    )}

                    {/* Task Submission Form for Akinator Game */}
                    {currentTask.title === 'Akinator Game' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>AKINATOR TERMINAL</h3>
                        <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '56.25%', borderRadius: '8px', marginBottom: '20px' }}>
                          <iframe 
                            src="https://en.akinator.com/" 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            title="Akinator Game"
                          />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>Play the game and enter the completion code given by the admin when Akinator guesses correctly.</p>
                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="COMPLETION KEYWORD..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px' }}>
                            SUBMIT KEYWORD
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Task Submission Form for Thugwar */}
                    {currentTask.title === 'Thugwar' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>ENTER DECRYPTION KEYWORD</h3>
                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="KEYWORD..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px' }}>
                            INITIATE TRANSFER
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Task Submission Form for QR Scanner */}
                    {currentTask.title === 'QR Scanner' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <QRScannerTask onSuccess={submitKeywordToAPI} />
                        {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '1.1rem', marginTop: '15px', fontWeight: 'bold' }}>{submitError}</p>}
                      </div>
                    )}

                    {/* Wordle Game UI for Wordle task */}
                    {(currentTask.title === 'Word Game' || currentTask.title === 'Wordle') && (
                      <WordleTask onSuccess={submitKeywordToAPI} />
                    )}

                    {/* Convince Me Game UI */}
                    {currentTask.title === 'Convince Me' && (
                      <ConvinceMeTask onSuccess={submitKeywordToAPI} />
                    )}

                    {/* Morse Code Game UI */}
                    {currentTask.title === 'Morse Code' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-green)', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>INTERCEPTED TRANSMISSION</h3>
                        
                        <div style={{ padding: '20px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '6px', marginBottom: '20px', letterSpacing: '4px', fontSize: '2rem', color: 'white', fontFamily: 'var(--font-mono)' }}>
                          --. .-. --- ..- -. -..
                        </div>

                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="DECODED MESSAGE..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-green)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
                            SUBMIT DECRYPTION
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Object Scanner UI */}
                    {currentTask.title === 'Object Scanner' && (
                      <ObjectScannerTask 
                        description={currentTask.description} 
                        teamId={team.id} 
                        taskId={currentTask.id}
                        onSuccess={() => fetchTeamData()}
                      />
                    )}

                    {/* Dictionary UI */}
                    {currentTask.title === 'Dictionary Game' && (
                      <DictionaryTask onSuccess={submitKeywordToAPI} />
                    )}

                    {/* Bottle Counting UI */}
                    {currentTask.title === 'Bottle Counting' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-purple)', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px' }}>BOTTLE COUNTING</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>Count the bottles carefully and enter the exact number below.</p>
                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="ENTER COUNT..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                            SUBMIT COUNT
                          </button>
                        </form>
                      </div>
                    )}

                    {/* TANGRAM UI */}
                    {currentTask.title === 'TANGRAM' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>TANGRAM PUZZLE</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>Solve the Tangram puzzle at the venue. Obtain the completion code from the admin once finished.</p>
                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="COMPLETION CODE..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px' }}>
                            VERIFY COMPLETION
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Phase 2 QR Tasks */}
                    {(currentTask.title === 'Phase 2 - QR 1' || currentTask.title === 'Phase 2 - QR 2' || currentTask.title === 'Phase 2 - QR 3') && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-blue)', borderRadius: '8px' }}>
                        <h3 className="neon-text-blue" style={{ marginBottom: '15px', textTransform: 'uppercase' }}>{currentTask.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>Find the QR code at the given location. You can scan it or enter the code manually.</p>
                        
                        <div style={{ width: '100%', marginBottom: '20px' }}>
                          <QRScannerTask onSuccess={submitKeywordToAPI} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', margin: '15px 0' }}>
                          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                          <span style={{ color: 'var(--text-secondary)' }}>OR</span>
                          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        </div>

                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE MANUALLY..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-blue)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px' }}>
                            VERIFY CODE
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Phase 2 Final Destination */}
                    {currentTask.title === 'Phase 2 - Final Destination' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-purple)', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 className="neon-text-purple" style={{ marginBottom: '15px' }}>FINAL DESTINATION</h3>
                        <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '20px' }}>
                          Head to the final location! The first team to arrive and enter the final keyword wins!
                        </p>
                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="FINAL KEYWORD..." 
                            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.8)', border: '2px solid var(--accent-purple)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
                          />
                          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
                          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                            CLAIM VICTORY
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '40px 20px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-red)', borderRadius: '8px', textAlign: 'center', marginTop: '20px' }}>
                    <h3 style={{ color: 'var(--accent-red)', marginBottom: '15px', fontSize: '2rem' }}>ACCESS DENIED</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>This task can only be viewed and completed by the team's <strong style={{color: 'white', textTransform: 'uppercase'}}>{currentTask.required_role}</strong>.</p>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '20px', fontSize: '1rem', fontStyle: 'italic' }}>Your mission is to communicate with them and assist in solving the puzzle!</p>
                  </div>
                )}
              </>
            ) : (
              <h2 className="neon-text-blue animate-pulse" style={{ fontSize: '2rem', marginBottom: '20px' }}>DECRYPTING INSTRUCTIONS...</h2>
            )}
          </div>
          
        </div>
        
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Team Roster */}
            <div className="glass-panel animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 className="neon-text-blue" style={{ marginBottom: '5px' }}>Team Roster</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(255, 0, 60, 0.05)', border: '1px solid var(--accent-red)', borderRadius: '6px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                <div>
                  <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 'bold' }}>CAPTAIN</p>
                  <p style={{ fontWeight: 'bold' }}>{team.member_a}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent-cyan)', borderRadius: '6px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'black' }}>B</div>
                <div>
                  <p style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 'bold' }}>ROLE B</p>
                  <p style={{ fontWeight: 'bold' }}>{team.member_b}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(157, 78, 221, 0.05)', border: '1px solid var(--accent-purple)', borderRadius: '6px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
                <div>
                  <p style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 'bold' }}>ROLE C</p>
                  <p style={{ fontWeight: 'bold' }}>{team.member_c}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid var(--accent-green)', borderRadius: '6px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'black' }}>D</div>
                <div>
                  <p style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 'bold' }}>ROLE D</p>
                  <p style={{ fontWeight: 'bold' }}>{team.member_d}</p>
                </div>
              </div>

            </div>

            {/* Campaign Progress */}
            <div className="glass-panel animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Missions Completed</span>
                <span className="neon-text-blue" style={{ fontWeight: 'bold' }}>0 / 10</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', background: 'var(--accent-blue)', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default function TeamDashboard() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', marginTop: '100px' }}><div className="neon-text-blue">Loading Mission Control...</div></div>}>
      <TeamDashboardContent />
    </Suspense>
  );
}
