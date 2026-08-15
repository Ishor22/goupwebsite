'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';

export default function SiteNav({ customerName }: { customerName: string | null }) {
  const { itemCount } = useCart();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <nav className="top-menu">
      <a href="/">Home</a>
      <a href="/products">Products</a>
      <a href="/cart">🛒 Cart{itemCount > 0 ? ` (${itemCount})` : ''}</a>
      {customerName ? (
        <>
          <a href="/customer/orders">My Orders</a>
          <a href="/customer">My Account</a>
          <button type="button" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </>
      ) : (
        <>
          <a href="/customer/login">Login</a>
          <a href="/customer/register">Register</a>
        </>
      )}
    </nav>
  );
}
