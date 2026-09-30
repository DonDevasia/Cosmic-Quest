'use client';
import { useState } from 'react';

const TARGET_WORD = 'SPACE';
const MAX_GUESSES = 6;

export default function WordleTask({ onSuccess }) {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (currentGuess.length !== 5) {
      setErrorMsg('Must be exactly 5 letters');
      return;
    }
    
    if (guesses.length >= MAX_GUESSES) {
      setErrorMsg('No more guesses allowed!');
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === TARGET_WORD) {
      // Trigger the API submission with the correct keyword
      setTimeout(() => onSuccess(TARGET_WORD), 1000); // 1s delay for dramatic effect
    } else if (newGuesses.length >= MAX_GUESSES) {
      setErrorMsg('SYSTEM LOCKOUT. MAX ATTEMPTS REACHED.');
    }
  };

  const getLetterStyle = (letter, index, guessStr) => {
    if (!guessStr) return { background: 'rgba(0,0,0,0.4)', border: '2px solid var(--glass-border)' };
    
    const targetArr = TARGET_WORD.split('');
    const char = letter;
    
    if (char === targetArr[index]) {
      return { background: 'var(--accent-green)', color: 'black', border: '2px solid var(--accent-green)' };
    }
    
    if (targetArr.includes(char)) {
      return { background: '#FFC107', color: 'black', border: '2px solid #FFC107' };
    }
    
    return { background: 'var(--glass-border)', color: 'white', border: '2px solid rgba(255,255,255,0.1)' };
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-purple)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ color: 'var(--accent-purple)', marginBottom: '5px' }}>LINGUISTIC DECRYPTION</h3>
      <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Decode the 5-letter cipher.</p>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)`, gap: '10px', marginBottom: '20px' }}>
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const guessStr = guesses[rowIndex];
          
          return (
            <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let letter = '';
                let style = getLetterStyle('', colIndex, null);
                
                if (guessStr) {
                  letter = guessStr[colIndex];
                  style = getLetterStyle(letter, colIndex, guessStr);
                } else if (isCurrentRow && currentGuess[colIndex]) {
                  letter = currentGuess[colIndex];
                }

                return (
                  <div key={colIndex} style={{
                    width: '50px', height: '50px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase',
                    borderRadius: '4px', transition: 'all 0.3s ease',
                    ...style
                  }}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {guesses.length < MAX_GUESSES && !guesses.includes(TARGET_WORD) && (
        <form onSubmit={handleGuessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
          <input 
            type="text" 
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
            placeholder="ENTER 5 LETTERS..." 
            style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-purple)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', textTransform: 'uppercase' }}
          />
          {errorMsg && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</p>}
          <button type="submit" className="cyber-button" style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
            SUBMIT GUESS
          </button>
        </form>
      )}

      {guesses.includes(TARGET_WORD) && (
        <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>
          DECRYPTION SUCCESSFUL
        </div>
      )}
    </div>
  );
}
