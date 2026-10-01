'use client';
import { useState, useRef, useEffect } from 'react';

const SCALE = 50;

const INITIAL_PIECES = [
  // Top Triangle
  { id: 1, type: 'tri-1', points: '0,0 100,-100 -100,-100', color: 'rgba(150, 240, 255, 0.9)', x: 150, y: 400, rotation: 90 },
  // Bottom Triangle
  { id: 2, type: 'tri-2', points: '0,0 100,100 -100,100', color: 'rgba(120, 180, 255, 0.9)', x: 300, y: 400, rotation: 180 },
  // Right Triangle
  { id: 3, type: 'tri-3', points: '0,0 100,100 100,-100', color: 'rgba(200, 150, 255, 0.9)', x: 450, y: 400, rotation: -90 },
  // Left Triangle
  { id: 4, type: 'tri-4', points: '0,0 -100,100 -100,-100', color: 'rgba(255, 150, 255, 0.9)', x: 300, y: 500, rotation: 0 },
];

function getDirection(type, rot) {
  const r = ((rot % 360) + 360) % 360; 
  if (r % 90 !== 0) return null; // Diagonal, invalid

  let baseDir = 0; // 0=UP, 1=RIGHT, 2=DOWN, 3=LEFT
  if (type === 'tri-1') baseDir = 0;
  if (type === 'tri-2') baseDir = 2;
  if (type === 'tri-3') baseDir = 1;
  if (type === 'tri-4') baseDir = 3;

  const steps = r / 90;
  return (baseDir + steps) % 4;
}

export default function TangramTask({ onSuccess }) {
  const [pieces, setPieces] = useState(INITIAL_PIECES);
  const [draggingId, setDraggingId] = useState(null);
  const [isSolved, setIsSolved] = useState(false);
  const svgRef = useRef(null);

  const handlePointerDown = (e, id) => {
    e.target.setPointerCapture(e.pointerId);
    setDraggingId(id);
  };

  const handlePointerMove = (e) => {
    if (!draggingId || !svgRef.current) return;
    
    // Get mouse position mapped to SVG coordinates
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    setPieces(prev => prev.map(p => 
      p.id === draggingId ? { ...p, x, y } : p
    ));
  };

  const handlePointerUp = (e) => {
    let checkNeeded = false;
    let newPiecesState = [];
    
    setPieces(prev => {
      newPiecesState = prev.map(p => {
        if (p.id === draggingId) {
          // Snap to center if close
          if (Math.abs(p.x - 300) < 50 && Math.abs(p.y - 200) < 50) {
            return { ...p, x: 300, y: 200 };
          }
        }
        return p;
      });
      return newPiecesState;
    });

    setDraggingId(null);
    setTimeout(() => checkWinCondition(newPiecesState), 50);
  };

  const handleDoubleClick = (id) => {
    let newPiecesState = [];
    setPieces(prev => {
      newPiecesState = prev.map(p => 
        p.id === id ? { ...p, rotation: (p.rotation + 45) % 360 } : p
      );
      return newPiecesState;
    });
    setTimeout(() => checkWinCondition(newPiecesState), 50);
  };

  const checkWinCondition = (currentPieces) => {
    if (isSolved) return;
    const directions = new Set();
    let allCentered = true;

    for (let p of currentPieces) {
      if (Math.abs(p.x - 300) > 10 || Math.abs(p.y - 200) > 10) {
        allCentered = false;
        break;
      }
      const dir = getDirection(p.type, p.rotation);
      if (dir === null) {
        allCentered = false;
        break;
      }
      directions.add(dir);
    }

    if (allCentered && directions.size === 4) {
      setIsSolved(true);
      setTimeout(() => {
        onSuccess('SMART'); // Send completion keyword to API
      }, 1000);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>TANGRAM ALIGNMENT PROTOCOL</h3>
      
      {isSolved ? (
        <div style={{ padding: '20px', background: 'rgba(0, 255, 0, 0.2)', border: '1px solid var(--accent-green)', borderRadius: '8px' }}>
          <h3 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>ALIGNMENT SUCCESSFUL</h3>
          <p style={{ color: 'white' }}>Transmitting confirmation to Starfleet...</p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Drag the 4 pieces to form a perfect Square inside the green target box. Double-tap a piece to rotate it.
          </p>

          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '600px', 
            aspectRatio: '1 / 1', 
            margin: '0 auto', 
            background: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            overflow: 'hidden',
            touchAction: 'none' // Prevent scrolling while dragging
          }}>
            {/* Target Outline (Green Space) */}
            <div style={{
              position: 'absolute',
              top: '100px',
              left: '200px',
              width: '200px',
              height: '200px',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              border: '2px dashed rgba(0, 255, 0, 0.8)',
              pointerEvents: 'none'
            }}>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(0,255,0,0.6)', fontWeight: 'bold', letterSpacing: '2px' }}>TARGET</span>
            </div>

            <svg 
              ref={svgRef}
              viewBox="0 0 600 600"
              width="100%" 
              height="100%" 
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {pieces.map(piece => (
                <polygon
                  key={piece.id}
                  points={piece.points}
                  fill={piece.color}
                  stroke="white"
                  strokeWidth="2"
                  transform={`translate(${piece.x}, ${piece.y}) rotate(${piece.rotation})`}
                  onPointerDown={(e) => handlePointerDown(e, piece.id)}
                  onDoubleClick={() => handleDoubleClick(piece.id)}
                  style={{ cursor: draggingId === piece.id ? 'grabbing' : 'grab', transition: draggingId === piece.id ? 'none' : 'transform 0.2s ease' }}
                />
              ))}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
