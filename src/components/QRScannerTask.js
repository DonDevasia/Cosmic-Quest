import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function QRScannerTask({ onSuccess }) {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (result) => {
    if (result && result.length > 0) {
      // result is an array of detected codes in the latest version of the library
      // usually we just take the first one
      const code = result[0].rawValue || result[0];
      if (code) {
        setIsScanning(false);
        // Automatically submit the scanned keyword
        onSuccess(code);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Failed to access camera or scan code.');
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-blue)', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-blue)', marginBottom: '15px' }}>QR SCANNER INITIATED</h3>
      
      {!isScanning ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            Initialize your device's optical sensors to scan the physical QR codes hidden in the area. Once a valid code is detected, it will be automatically transmitted.
          </p>
          <button 
            onClick={() => setIsScanning(true)} 
            className="cyber-button" 
            style={{ padding: '15px 30px', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', fontSize: '1.2rem' }}
          >
            ACTIVATE CAMERA
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
          <div style={{ border: '2px solid var(--accent-blue)', borderRadius: '8px', overflow: 'hidden' }}>
            <Scanner 
              onScan={handleScan} 
              onError={handleError}
              constraints={{ facingMode: 'environment' }} 
            />
          </div>
          {error && <p style={{ color: 'var(--accent-red)', marginTop: '10px' }}>{error}</p>}
          <button 
            onClick={() => setIsScanning(false)} 
            className="cyber-button" 
            style={{ marginTop: '20px', borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}
          >
            ABORT SCAN
          </button>
        </div>
      )}
    </div>
  );
}
