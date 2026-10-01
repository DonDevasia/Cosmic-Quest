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
import TangramTask from '@/components/TangramTask';


function TeamDashboardContent() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('id'); // Using team_code passed from login

  const [team, setTeam] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterTimeLeft, setMasterTimeLeft] = useState(480); // 8 mins max
  const [keyword, setKeyword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

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

    // 2.5 Get Completed Tasks Count
    const { data: pastTasks } = await supabase
      .from('team_tasks')
      .select('task_id')
      .eq('team_id', teamData.id)
      .eq('is_active', false);
      
    if (pastTasks) {
      setCompletedTasksCount(Math.min(pastTasks.length, 10));
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
        tasks (title, description, base_points, time_limit_seconds, venue_hint, task_number)
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
      
      setCurrentTask(taskData);
      
      // Calculate remaining time
      let masterRemaining = 0;
      if (assignment.assigned_at) {
        const elapsed = Math.floor((Date.now() - new Date(assignment.assigned_at).getTime()) / 1000);
        masterRemaining = Math.max(0, taskData.time_limit_seconds - elapsed);
      }
      
      setMasterTimeLeft(masterRemaining);
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

  // Presence Subscription (Lobby) removed since it's a single device.

  // Task Countdown Timer and Expiration
  useEffect(() => {
    let timerId;
    if (currentTask && masterTimeLeft > 0) {
      timerId = setInterval(() => {
        let newMaster = 0;
        
        if (currentTask.assigned_at) {
          const masterElapsed = Math.floor((Date.now() - new Date(currentTask.assigned_at).getTime()) / 1000);
          newMaster = Math.max(0, currentTask.time_limit_seconds - masterElapsed);
        }

        setMasterTimeLeft(newMaster);

        const isPhase2 = currentTask.task_number > 10;

        if (newMaster <= 0 && !isPhase2) {
          clearInterval(timerId);
          handleTaskExpired();
        }
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [currentTask, masterTimeLeft]);

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
      console.error('Failed to report master expiration');
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
    return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}><div className="neon-text-blue animate-pulse">Calibrating Navigational Charts...</div></div>;
  }

  if (!team) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '100px', color: 'var(--accent-red)' }}>Error: Invalid Team Code or Not Connected to Database</div>;
  }

  return (
    <div className="container">
      <Navbar title={`${team.team_name}`} subtitle="Mission Interface" />
      
      {!isGameStarted ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
          <div className="animate-pulse" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
          <h1 className="neon-text-blue" style={{ fontSize: '3rem', textAlign: 'center' }}>WAITING FOR LAUNCH SEQUENCE</h1>
          <p className="text-secondary" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Please wait for Fleet Command to initiate the cosmic voyage...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Main Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Current Task & Timer */}
          <div className="glass-panel animate-slide-up" style={{ padding: '40px', textAlign: 'center', background: 'rgba(0, 240, 255, 0.05)' }}>
            <p className="text-secondary" style={{ marginBottom: '10px' }}>SECTOR DIRECTIVE</p>
            {currentTask ? (
              <>
                <h2 className="neon-text-blue" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{currentTask.title}</h2>
                
                {/* Timers */}
                {currentTask.task_number <= 10 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                    {/* Master Timer */}
                    <div>
                      <div className="neon-text-purple" style={{ fontSize: currentTask.started_at ? '2.5rem' : '4rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: masterTimeLeft === 0 ? 'var(--accent-red)' : '' }}>
                        {formatTime(masterTimeLeft)}
                      </div>
                      <p className="text-secondary" style={{ marginTop: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        DIRECTIVE TIME LIMIT
                      </p>
                    </div>
                  </div>
                )}

                {currentTask.status === 'Assigned' ? (
                  <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-purple)', borderRadius: '8px' }}>
                    {showExpiredMessage && (
                      <div style={{ padding: '15px', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--accent-red)', marginBottom: '5px' }}>TASK EXPIRED</h3>
                        <p style={{ color: 'white', fontSize: '1rem' }}>You ran out of time for the previous task.</p>
                      </div>
                    )}
                    <h3 style={{ color: 'var(--accent-purple)', marginBottom: '10px' }}>TRAVEL TO VENUE</h3>
                    {currentTask.venue_hint.startsWith('IMAGE:') ? (
                      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <img 
                          src={currentTask.venue_hint.replace('IMAGE:', '')} 
                          alt="Venue Clue" 
                          style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid var(--accent-purple)' }} 
                        />
                      </div>
                    ) : (
                      <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '20px' }}>"{currentTask.venue_hint}"</p>
                    )}
                    
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
                      {currentTask.title.includes('Phase 2') ? 'Scan the QR code at the location to advance.' : 'Scan the Venue QR code at the location to unlock the puzzle.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <QRScannerTask onSuccess={currentTask.title.includes('Phase 2') ? submitKeywordToAPI : startTaskFromQR} />
                      {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '1.1rem', marginTop: '15px', fontWeight: 'bold' }}>{submitError}</p>}
                    </div>
                  </div>
                ) : currentTask.status === 'Submitted' ? (
                  <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-blue)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--accent-blue)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
                    <h3 style={{ color: 'var(--accent-blue)', marginBottom: '10px' }}>TRANSMITTING TO STARFLEET...</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Awaiting verification from Fleet Command.</p>
                  </div>
                ) : currentTask.status === 'Completed' ? (
                  <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-green)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--accent-green)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
                    <h3 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>WAITING FOR NEXT TASK</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Good job! You completed the task before time. Please wait for the master timer to expire to receive your next mission.</p>
                  </div>
                ) : currentTask.status === 'Failed' ? (
                  <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-red)', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--accent-red)', marginBottom: '10px', fontSize: '2rem' }}>TASK FAILED</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>You failed to solve the puzzle. Please wait for the master timer to expire to receive your next mission.</p>
                  </div>
                ) : (
                  <>
                    {/* Rejection Feedback */}
                    {currentTask.admin_feedback && currentTask.status === 'In Progress' && (
                      <div style={{ padding: '15px', background: 'rgba(255, 0, 60, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--accent-red)', marginBottom: '5px' }}>SCAN REJECTED</h3>
                        <p style={{ color: 'white', fontSize: '1rem' }}>{currentTask.admin_feedback}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '10px' }}>Please try again. The timer is still running!</p>
                      </div>
                    )}

                    {/* Task Submission Form for Tongue Twister */}
                    {currentTask.title === 'Tongue Twister' && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>VOCAL OVERRIDE MODULE</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>Say the tongue twister perfectly to the Admin. Enter the completion code they provide once you succeed.</p>
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
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>ENTER AUTHORIZATION CODE</h3>
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
                            AUTHORIZE TRANSFER
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
                        <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>ALIEN TRANSMISSION</h3>
                        
                        <div style={{ padding: '20px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '6px', marginBottom: '20px', letterSpacing: '4px', fontSize: '2rem', color: 'white', fontFamily: 'var(--font-mono)' }}>
                          --. .-. --- ..- -. -..
                        </div>

                        <form onSubmit={handleSubmitKeyword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                            placeholder="DECODED SIGNAL..." 
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
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>DATA ARCHIVE QUERY</h3>
                        <div style={{ padding: '20px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '6px', marginBottom: '20px', fontSize: '1.2rem', color: 'white', fontStyle: 'italic' }}>
                          &quot;relating to the vast universe, the cosmos, or space outside of Earth&quot;
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Enter the word that matches this definition.</p>
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
                      <TangramTask onSuccess={submitKeywordToAPI} />
                    )}


                  </>
                )}
              </>
            ) : (
              <h2 className="neon-text-blue animate-pulse" style={{ fontSize: '2rem', marginBottom: '20px' }}>DECRYPTING COORDINATES...</h2>
            )}
          </div>
          
        </div>
        
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Campaign Progress */}
            <div className="glass-panel animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Phase 1 Directives Accomplished</span>
                <span className="neon-text-blue" style={{ fontWeight: 'bold' }}>{completedTasksCount} / 10</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(completedTasksCount / 10) * 100}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.5s ease' }}></div>
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
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', marginTop: '100px' }}><div className="neon-text-blue">Initializing Mission Interface...</div></div>}>
      <TeamDashboardContent />
    </Suspense>
  );
}
