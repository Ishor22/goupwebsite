'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid email or password.');
      }

      // Only ever redirect to a same-site path already known to this app --
      // never trust the raw query value as a full external URL.
      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/customer');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="customer-login-email">Email</label>
        <input
          id="customer-login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-login-password">Password</label>
        <input
          id="customer-login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="admin-actions">
        <button type="submit" className="save-button" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </div>
      {error && <p className="admin-message error">{error}</p>}
    </form>
  );
}
