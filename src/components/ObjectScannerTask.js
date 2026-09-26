'use client';
import { useState, useRef } from 'react';

export default function ObjectScannerTask({ description, onSuccess, teamId, taskId }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setIsUploading(true);

    try {
      // Compress the image before uploading to avoid large payload errors
      const compressedBase64 = await compressImage(file, 800, 0.6); // Max 800px width, 60% quality

      const res = await fetch('/api/team/submit-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          taskId,
          payload: compressedBase64
        })
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess(); // Signal success so UI can update
      } else {
        setError(data.message || 'Failed to submit photo');
      }
    } catch (err) {
      console.error(err);
      setError('System Error: Failed to process or upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  // HTML5 Canvas image compression
  const compressImage = (file, maxWidth, quality) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Return as base64 string
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-blue)', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-blue)', marginBottom: '15px' }}>OBJECT SCANNER</h3>
      
      <div style={{ padding: '20px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ color: 'white', fontSize: '1.2rem', fontStyle: 'italic' }}>
          "{description || 'Awaiting target description...'}"
        </p>
      </div>

      {error && <p style={{ color: 'var(--accent-red)', marginBottom: '15px', fontWeight: 'bold' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        {/* Hidden file input for camera capture */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleCapture}
          ref={fileInputRef}
          style={{ display: 'none' }} 
          id="cameraInput"
        />
        
        <label 
          htmlFor="cameraInput"
          className="cyber-button" 
          style={{ 
            display: 'inline-block',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.5 : 1,
            width: '100%',
            maxWidth: '300px'
          }}
        >
          {isUploading ? 'UPLOADING SCAN...' : 'ACTIVATE SCANNER (TAKE PHOTO)'}
        </label>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Please ensure the object is clearly visible and well-lit before capturing.
        </p>
      </div>
    </div>
  );
}
