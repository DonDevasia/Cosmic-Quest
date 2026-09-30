import './globals.css';
import Starfield from '@/components/Starfield';
import Astronaut from '@/components/Astronaut';

export const metadata = {
  title: 'Treasure Hunt Mission Control',
  description: 'Interactive tech-oriented treasure hunt platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Starfield />
        <div style={{ position: 'relative', zIndex: 10 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
