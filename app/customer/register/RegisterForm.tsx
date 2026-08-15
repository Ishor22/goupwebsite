'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterForm({ loginHref = '/customer/login' }: { loginHref?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, confirmPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to create account. Please try again.');
      }

      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/customer');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unable to create account. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="customer-register-name">Full Name</label>
        <input id="customer-register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="customer-register-email">Email</label>
        <input
          id="customer-register-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-register-phone">Phone</label>
        <input
          id="customer-register-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-register-password">Password</label>
        <input
          id="customer-register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-register-confirm-password">Confirm Password</label>
        <input
          id="customer-register-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="admin-actions">
        <button type="submit" className="save-button" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </div>
      {error && <p className="admin-message error">{error}</p>}
      <p className="admin-panel-note">
        Already have an account? <a href={loginHref}>Login here</a>
      </p>
    </form>
  );
}
