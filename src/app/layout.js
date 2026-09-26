import './globals.css';

export const metadata = {
  title: 'Treasure Hunt Mission Control',
  description: 'Interactive tech-oriented treasure hunt platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
