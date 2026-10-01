'use client';
import { useState, useRef } from 'react';

export default function ObjectScannerTask({ description, onSuccess, teamId, taskId }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  
  const fileInput1Ref = useRef(null);
  const fileInput2Ref = useRef(null);

  const handleCapture1 = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.6);
      setImage1(compressed);
    } catch (err) {
      console.error(err);
      setError('Failed to process first image');
    }
  };

  const handleCapture2 = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.6);
      setImage2(compressed);
    } catch (err) {
      console.error(err);
      setError('Failed to process second image');
    }
  };

  const handleSubmit = async () => {
    if (!image1 || !image2) {
      setError('Please capture both images before submitting.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const stitchedBase64 = await stitchImages(image1, image2);

      const res = await fetch('/api/team/submit-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          taskId,
          payload: stitchedBase64
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
      setError('System Error: Failed to submit images');
    } finally {
      setIsUploading(false);
    }
  };

  const stitchImages = (base64_1, base64_2) => {
    return new Promise((resolve, reject) => {
      const img1 = new Image();
      const img2 = new Image();
      img1.src = base64_1;
      img1.onload = () => {
        img2.src = base64_2;
        img2.onload = () => {
          const targetHeight = 800;
          const width1 = (img1.width / img1.height) * targetHeight;
          const width2 = (img2.width / img2.height) * targetHeight;
          
          const canvas = document.createElement('canvas');
          canvas.width = width1 + width2;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(img1, 0, 0, width1, targetHeight);
          ctx.drawImage(img2, width1, 0, width2, targetHeight);
          
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img2.onerror = reject;
      };
      img1.onerror = reject;
    });
  };

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
          
          resolve(canvas.toDataURL('image/jpeg', quality));
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Item 1 */}
        <div style={{ padding: '15px', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--accent-blue)' }}>TARGET 1: BLACK SHIRT GUY</h4>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleCapture1}
            ref={fileInput1Ref}
            style={{ display: 'none' }} 
            id="cameraInput1"
          />
          <label 
            htmlFor="cameraInput1"
            className="cyber-button" 
            style={{ display: 'inline-block', cursor: 'pointer', width: '100%', maxWidth: '300px' }}
          >
            {image1 ? 'RETAKE PHOTO 1' : 'SCAN TARGET 1'}
          </label>
          {image1 && <div style={{ marginTop: '10px', color: 'var(--accent-green)' }}>✓ Target 1 Scanned</div>}
        </div>

        {/* Item 2 */}
        <div style={{ padding: '15px', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--accent-blue)' }}>TARGET 2: FIRE EXTINGUISHER</h4>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleCapture2}
            ref={fileInput2Ref}
            style={{ display: 'none' }} 
            id="cameraInput2"
          />
          <label 
            htmlFor="cameraInput2"
            className="cyber-button" 
            style={{ display: 'inline-block', cursor: 'pointer', width: '100%', maxWidth: '300px' }}
          >
            {image2 ? 'RETAKE PHOTO 2' : 'SCAN TARGET 2'}
          </label>
          {image2 && <div style={{ marginTop: '10px', color: 'var(--accent-green)' }}>✓ Target 2 Scanned</div>}
        </div>

        {/* Submit */}
        <button 
          onClick={handleSubmit}
          disabled={!image1 || !image2 || isUploading}
          className="cyber-button"
          style={{ 
            marginTop: '10px',
            opacity: (!image1 || !image2 || isUploading) ? 0.5 : 1,
            cursor: (!image1 || !image2 || isUploading) ? 'not-allowed' : 'pointer'
          }}
        >
          {isUploading ? 'TRANSMITTING...' : 'SUBMIT COMBINED SCANS'}
        </button>
      </div>
    </div>
  );
}
