import { useState, useRef, useEffect } from 'react';

export default function ConvinceMeTask({ onSuccess }) {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Don't talk to me. We are done." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [submitError, setSubmitError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/team/convince-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: messages.filter(m => m.role === 'user').map(m => m.content) 
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
      
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'She read your message and ignored you. (Connection Error)' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordSubmit = (e) => {
    e.preventDefault();
    if (!keywordInput.trim()) return;
    
    // We let the parent component handle the actual task submission
    // by passing the keyword up.
    onSuccess(keywordInput.trim());
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        background: 'rgba(0,0,0,0.6)', 
        border: '1px solid var(--accent-cyan)', 
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '400px'
      }}>
        {/* Chat History */}
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 60, 0.2)',
              border: `1px solid ${msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--accent-red)'}`,
              padding: '10px 15px',
              borderRadius: '8px',
              maxWidth: '80%',
              color: 'white'
            }}>
              <div style={{ fontSize: '0.7rem', color: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--accent-red)', marginBottom: '5px' }}>
                {msg.role === 'user' ? 'YOU' : 'VIRTUAL EX-GF'}
              </div>
              <div>{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)' }}>
              She is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.8)', borderTop: '1px solid var(--glass-border)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message to convince her..." 
              disabled={isLoading}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: 'rgba(0,0,0,0.6)', 
                border: '1px solid var(--glass-border)', 
                color: 'white', 
                borderRadius: '4px' 
              }}
            />
            <button type="submit" disabled={isLoading} className="cyber-button" style={{ minWidth: '100px' }}>
              SEND
            </button>
          </form>
        </div>
      </div>

      {/* Manual Keyword Submission Form */}
      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px' }}>
        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px', textAlign: 'center' }}>ENTER THE SECURED KEYWORD</h3>
        <p style={{ textAlign: 'center', marginBottom: '15px', color: 'var(--text-secondary)' }}>
          If you successfully convince her to patch up, she will give you the keyword. Enter it below.
        </p>
        <form onSubmit={handleKeywordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value.toUpperCase())}
            placeholder="KEYWORD..." 
            style={{ width: '100%', maxWidth: '300px', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}
          />
          {submitError && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '5px' }}>{submitError}</p>}
          <button type="submit" className="cyber-button" style={{ marginTop: '10px', width: '100%', maxWidth: '300px' }}>
            INITIATE TRANSFER
          </button>
        </form>
      </div>
    </div>
  );
}
