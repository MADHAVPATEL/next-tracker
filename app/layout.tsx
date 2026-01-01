import React from 'react';
import './globals.css';

/**
 * Note: In your local GitHub project, you can keep the 'globals.css' import 
 * if you have created that file. For now, we use inline Tailwind via the 
 * body class to ensure the preview stays stable.
 */

export const metadata = {
  title: 'Pulse SaaS',
  description: 'Edge Tracking Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
