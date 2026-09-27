import { useState } from 'react';

export default function DictionaryTask({ onSuccess }) {
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');

  // We can make this dynamic if needed, but for now we hardcode a puzzle
  const definition = "A ghost in the system; a program that operates without user intervention.";
  const answer = "DAEMON";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (guess.trim().toUpperCase() === answer) {
      // Pass the success keyword to the parent API
      onSuccess(answer);
    } else {
      setError('ACCESS DENIED: INCORRECT TERM');
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-purple)', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px' }}>CYBER DICTIONARY</h3>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(157, 78, 221, 0.1)', borderLeft: '4px solid var(--accent-purple)', textAlign: 'left' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>QUERY DEFINITION:</p>
        <p style={{ color: 'white', fontSize: '1.1rem', fontStyle: 'italic' }}>"{definition}"</p>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Identify the exact term that matches this definition.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <input 
          type="text" 
          value={guess}
          onChange={(e) => setGuess(e.target.value.toUpperCase())}
          placeholder="ENTER TERM..." 
          style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
        />
        {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{error}</p>}
        <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
          SUBMIT ENTRY
        </button>
      </form>
    </div>
  );
}
