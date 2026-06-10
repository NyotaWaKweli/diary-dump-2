import './globals.css';

export const metadata = {
  title: 'Diary Dump',
  description: 'A scattered wall of personal diaries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=VT323&family=Caveat:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Indie+Flower&family=Shadows+Into+Light&family=Kalam:wght@300;400;700&family=Patrick+Hand&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#1a1614', color: '#ebcfbc' }}>
        {children}
      </body>
    </html>
  );
}
