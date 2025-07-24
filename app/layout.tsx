import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'ISRM', description: 'Interactionist Self-Regulation Model' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
