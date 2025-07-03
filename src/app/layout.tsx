import './globals.css';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DE Quotation Generator",
  description: 'Create, save, and download quotations in PDF format.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet"></link>
        <link rel="icon" href="/favicon.jpg" />
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
