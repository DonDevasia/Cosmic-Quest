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

export default function VenueQrGenerator() {
  return (
    <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="print-hide">
        <h1>Printable Venue QR Codes</h1>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: 'purple', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Print Venue Codes
        </button>
      </div>

      <p className="print-hide" style={{ marginBottom: '30px' }}>
        <strong>Admin Note:</strong> These are the physical QR codes you must place at each venue. Players will scan these to START their task timer. Do not mix them up!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', justifyContent: 'center' }}>
        {VENUES.map((v, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid', border: '2px dashed #ccc', padding: '20px', borderRadius: '10px' }}>
            <h2 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Task {v.task}: {v.title}</h2>
            <p style={{ fontStyle: 'italic', color: '#555', textAlign: 'center', marginBottom: '15px' }}>"{v.hint}"</p>
            <QRCodeSVG value={`${v.code} - ${v.title}`} size={200} />
            <span style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold' }}>Scan to Start Mission</span>
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
