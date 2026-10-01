'use client';
import { QRCodeSVG } from 'qrcode.react';

const VENUES = [
  { task: 1, title: 'Tongue Twister', code: 'VENUE_01', hint: 'A' },
  { task: 2, title: 'QR Scanner', code: 'VENUE_02', hint: 'B' },
  { task: 3, title: 'Thugwar', code: 'VENUE_03', hint: 'C' },
  { task: 4, title: 'Object Scanner', code: 'VENUE_04', hint: 'D' },
  { task: 5, title: 'Word Game', code: 'VENUE_05', hint: 'E' },
  { task: 6, title: 'Convince Me', code: 'VENUE_06', hint: 'F' },
  { task: 7, title: 'Dictionary Game', code: 'VENUE_07', hint: 'G' },
  { task: 8, title: 'Morse Code', code: 'VENUE_08', hint: 'H' },
  { task: 9, title: 'Bottle Counting', code: 'VENUE_09', hint: 'I' },
  { task: 10, title: 'TANGRAM', code: 'VENUE_10', hint: 'J' }
];

const IN_GAME_QRS = [
  { title: 'Task 2: QR Scanner (Hidden Code)', code: 'THE_ARCHITECT', hint: 'Hide this somewhere for players to scan during Task 2' },
  { title: 'Phase 2 - Location 1 QR', code: 'LOC1_CODE', hint: 'Hide this at Phase 2 Location 1' },
  { title: 'Phase 2 - Location 2 QR', code: 'LOC2_CODE', hint: 'Hide this at Phase 2 Location 2' },
  { title: 'Phase 2 - Location 3 QR', code: 'LOC3_CODE', hint: 'Hide this at Phase 2 Location 3' },
  { title: 'Final Destination QR (VICTORY)', code: 'VICTORY', hint: 'Hide this at the absolute Final Destination for the teams to scan and win' }
];

const FAKE_QRS = Array.from({ length: 18 }, (_, i) => ({
  title: `Decoy QR ${i + 1}`,
  code: `INVALID_DECOY_${i + 1}`,
  hint: 'This is a fake QR code. Keep searching!'
}));

// Chunk helper to split arrays into groups of N
const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export default function VenueQrGenerator() {
  const venueChunks = chunkArray(VENUES, 6);
  const inGameChunks = chunkArray(IN_GAME_QRS, 6);
  const fakeChunks = chunkArray(FAKE_QRS, 6);

  return (
    <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ padding: '20px' }} className="print-hide">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Printable QR Codes</h1>
          <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: 'purple', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Print All Codes
          </button>
        </div>
        <p style={{ marginBottom: '30px', fontSize: '16px' }}>
          <strong>Admin Note:</strong> The printed layout is designed to perfectly fit <strong>6 QR codes per standard A4 page</strong>. 
          <br/>When printing, ensure margins are set to default, and background graphics are disabled for the best result.
        </p>
      </div>

      {/* VENUE QRS */}
      {venueChunks.map((chunk, chunkIndex) => (
        <div key={`venue-${chunkIndex}`} className="print-page">
          <div style={{ textAlign: 'center', marginBottom: '20px' }} className="print-header">
            <h2>START VENUE CODES (Page {chunkIndex + 1} of {venueChunks.length})</h2>
            <p>Players scan these to START their 8-minute timer</p>
          </div>
          <div className="qr-grid-6">
            {chunk.map((v, index) => (
              <div key={index} className="qr-card" style={{ borderColor: '#ccc' }}>
                <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Task {v.task}: {v.title}</h3>
                <p style={{ fontStyle: 'italic', color: '#555', textAlign: 'center', marginBottom: '15px' }}>"{v.hint}"</p>
                <QRCodeSVG value={`${v.code} - ${v.title}`} size={200} />
                <span style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold' }}>Scan to Start Mission</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* IN-GAME QRS */}
      {inGameChunks.map((chunk, chunkIndex) => (
        <div key={`ingame-${chunkIndex}`} className="print-page">
          <div style={{ textAlign: 'center', marginBottom: '20px' }} className="print-header">
            <h2 style={{ color: '#ff3366' }}>IN-GAME / COMPLETION QRS (Page {chunkIndex + 1} of {inGameChunks.length})</h2>
            <p>Players scan these to COMPLETE specific tasks</p>
          </div>
          <div className="qr-grid-6">
            {chunk.map((v, index) => (
              <div key={index} className="qr-card" style={{ borderColor: '#ff3366' }}>
                <h3 style={{ margin: '0 0 10px 0', textAlign: 'center', color: '#ff3366' }}>{v.title}</h3>
                <p style={{ fontStyle: 'italic', color: '#555', textAlign: 'center', marginBottom: '15px', fontSize: '14px' }}>{v.hint}</p>
                <QRCodeSVG value={v.code} size={200} />
                <span style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold' }}>Scan to Complete Mission</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* FAKE DECOY QRS */}
      {fakeChunks.map((chunk, chunkIndex) => (
        <div key={`fake-${chunkIndex}`} className="print-page">
          <div style={{ textAlign: 'center', marginBottom: '20px' }} className="print-header">
            <h2 style={{ color: '#666' }}>FAKE DECOY QRS (Page {chunkIndex + 1} of {fakeChunks.length})</h2>
            <p>Hide these around the venue for Task 2 to trick players</p>
          </div>
          <div className="qr-grid-6">
            {chunk.map((v, index) => (
              <div key={index} className="qr-card" style={{ borderColor: '#000', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ margin: '0 0 10px 0', textAlign: 'center', color: '#666' }}>{v.title}</h3>
                <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center', marginBottom: '15px', fontSize: '14px' }}>{v.hint}</p>
                <QRCodeSVG value={v.code} size={200} />
                <span style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold', color: 'red' }}>INVALID SCANNABLE</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <style jsx global>{`
        .qr-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed;
          padding: 20px;
          border-radius: 10px;
          box-sizing: border-box;
          background-color: white;
        }
        
        .qr-grid-6 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 0 20px;
        }

        .print-page {
          margin-bottom: 50px;
        }

        @media screen {
          .qr-grid-6 {
            max-width: 900px;
            margin: 0 auto;
          }
          .print-header {
            margin-top: 40px;
          }
        }

        @media print {
          @page {
            margin: 10mm;
          }
          .print-hide {
            display: none !important;
          }
          body {
            background-color: white !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0;
            padding: 0;
            height: 270mm; /* Force exactly one page */
            display: flex;
            flex-direction: column;
          }
          .print-header {
            margin-bottom: 10px !important;
          }
          .qr-grid-6 {
            flex: 1;
            grid-template-rows: repeat(3, 1fr);
            gap: 15px;
            padding: 0;
          }
          .qr-card {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}
