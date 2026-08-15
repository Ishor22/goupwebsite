import type { Metadata } from 'next';
import { CartProvider } from '@/components/shop/CartContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'दाजुभाइ समूह',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
