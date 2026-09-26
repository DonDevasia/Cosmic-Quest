'use client';
import { QRCodeSVG } from 'qrcode.react';

// The correct keyword
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

// We will generate 35 fake codes and 1 correct code
const FAKE_COUNT = 35;
const ALL_CODES = [...generateFakeKeywords(FAKE_COUNT), CORRECT_KEYWORD];

// Shuffle array so the correct one is hidden
for (let i = ALL_CODES.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [ALL_CODES[i], ALL_CODES[j]] = [ALL_CODES[j], ALL_CODES[i]];
}

export default function QrGenerator() {
  return (
    <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="print-hide">
        <h1>Printable QR Codes for "QR Scanner" Task</h1>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Print Page
        </button>
      </div>

      <p className="print-hide" style={{ marginBottom: '30px' }}>
        <strong>Admin Note:</strong> There are {FAKE_COUNT} fake QR codes and 1 correct one. The correct one decodes to <strong>{CORRECT_KEYWORD}</strong>. Print this page and scatter the codes around!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', justifyContent: 'center' }}>
        {ALL_CODES.map((code, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid' }}>
            <QRCodeSVG value={code} size={150} />
            <span style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>Code #{index + 1}</span>
            {/* The line below helps the admin secretly know which one is correct after printing, using a tiny dot. */}
            <span style={{ fontSize: '6px' }}>{code === CORRECT_KEYWORD ? '.' : ' '}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}
