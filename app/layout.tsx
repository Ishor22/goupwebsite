import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'दाजुभाइ समूह',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne">
      <body>{children}</body>
    </html>
  );
}
