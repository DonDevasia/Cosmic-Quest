'use client';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

// The correct keyword for the Phase 1 QR task
const CORRECT_KEYWORD = "THE_ARCHITECT";

// Generate fake random keywords
const generateFakeKeywords = (count) => {
  const fakes = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < count; i++) {
    let fakeStr = '';
    for (let j = 0; j < 10; j++) {
      fakeStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    fakes.push(`FAKE_` + fakeStr);
  }
  return fakes;
};

const FAKE_COUNT = 35;
const PHASE_1_VENUES = Array.from({ length: 10 }, (_, i) => `VENUE_${(i + 1).toString().padStart(2, '0')}`);
const PHASE_2_QRS = ['LOC1_CODE', 'LOC2_CODE', 'LOC3_CODE'];
const FINAL_DEST_QR = 'VENUE_14';

export default function QrGenerator() {
  const [allCodes, setAllCodes] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Generate 35 fake codes and 1 correct code
    const codes = [...generateFakeKeywords(FAKE_COUNT), CORRECT_KEYWORD];

    // Shuffle array so the correct one is hidden
    for (let i = codes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }

    setAllCodes(codes);
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h1>Loading Master QR Code Generator...</h1>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="print-hide">
        <h1>Master QR Code Generator</h1>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
          Print All QR Codes
        </button>
      </div>

      {/* PHASE 2 SCAVENGER HUNT QRS */}
      <div style={{ borderBottom: '2px dashed #ccc', paddingBottom: '40px', marginBottom: '40px' }}>
        <h2>Phase 2: Scavenger Hunt & Final Destination QRs</h2>
        <p>Hide these at the Phase 2 locations. Scanning them instantly progresses the team.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
          {PHASE_2_QRS.map((code, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid' }}>
              <QRCodeSVG value={code} size={150} />
              <span style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>Phase 2 - Location {index + 1}</span>
              <span style={{ fontSize: '10px', color: '#666' }}>({code})</span>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid' }}>
            <QRCodeSVG value={FINAL_DEST_QR} size={150} />
            <span style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>Final Destination Venue</span>
            <span style={{ fontSize: '10px', color: '#666' }}>({FINAL_DEST_QR})</span>
          </div>
        </div>
      </div>

      {/* PHASE 1 VENUE QRS */}
      <div style={{ borderBottom: '2px dashed #ccc', paddingBottom: '40px', marginBottom: '40px' }}>
        <h2>Phase 1: Venue QRs</h2>
        <p>Stick these at the 10 different task venues. Players scan these to "unlock" their assigned task mini-game.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
          {PHASE_1_VENUES.map((code, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid' }}>
              <QRCodeSVG value={code} size={150} />
              <span style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>Venue {index + 1}</span>
              <span style={{ fontSize: '10px', color: '#666' }}>({code})</span>
            </div>
          ))}
        </div>
      </div>

      {/* QR SCANNER TASK DECOYS */}
      <div>
        <h2>Phase 1 Puzzle: The "QR Scanner" Task Decoys</h2>
        <p>Scatter these in a single location! There are {FAKE_COUNT} fake QR codes and 1 correct one. The correct one decodes to <strong>{CORRECT_KEYWORD}</strong> (marked with a tiny dot).</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', justifyContent: 'center' }}>
          {allCodes.map((code, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid', border: '1px solid #eee', padding: '10px' }}>
              <QRCodeSVG value={code} size={150} />
              <span style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>Code #{index + 1}</span>
              {/* The line below helps the admin secretly know which one is correct after printing, using a tiny dot. */}
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{code === CORRECT_KEYWORD ? '.' : ' '}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
