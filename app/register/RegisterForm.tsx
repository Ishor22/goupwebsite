'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Brother = { id: string; name: string };

export default function RegisterForm({ brothers }: { brothers: Brother[] }) {
  const router = useRouter();
  const [brotherId, setBrotherId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/brother/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brotherId, email, code, password, confirmPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to create account. Please try again.');
      }

      router.push('/brother');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unable to create account. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="register-brother">दाजुभाइको नाम</label>
        <select
          id="register-brother"
          value={brotherId}
          onChange={(e) => setBrotherId(e.target.value)}
          required
        >
          <option value="" disabled>
            -- नाम छान्नुहोस् --
          </option>
          {brothers.map((brother) => (
            <option key={brother.id} value={brother.id}>
              {brother.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-code">दर्ता कोड (Registration Code)</label>
        <input
          id="register-code"
          type="text"
          placeholder="XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <input
          id="register-confirm-password"
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
          {submitting ? 'Creating account...' : 'Create Brother Account'}
        </button>
      </div>
      {error && <p className="admin-message error">{error}</p>}
      <p className="admin-panel-note">
        पहिले नै खाता छ? <a href="/brother/login">यहाँ लगइन गर्नुहोस्</a>
      </p>
    </form>
  );
}
