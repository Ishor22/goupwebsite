'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Profile = {
  name: string;
  email: string;
  phone: string | null;
  defaultAddress: string | null;
  defaultCity: string | null;
  defaultLandmark: string | null;
};

export default function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialProfile.name,
    email: initialProfile.email,
    phone: initialProfile.phone || '',
    defaultAddress: initialProfile.defaultAddress || '',
    defaultCity: initialProfile.defaultCity || '',
    defaultLandmark: initialProfile.defaultLandmark || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update profile. Please try again.');

      setMessage({ text: 'Profile updated successfully.', isError: false });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Unable to update profile. Please try again.', isError: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="form-group">
        <label htmlFor="customer-profile-name">Full Name</label>
        <input
          id="customer-profile-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-profile-email">Email</label>
        <input
          id="customer-profile-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-profile-phone">Phone</label>
        <input
          id="customer-profile-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-profile-address">Default Delivery Address</label>
        <input
          id="customer-profile-address"
          type="text"
          value={form.defaultAddress}
          onChange={(e) => setForm((f) => ({ ...f, defaultAddress: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-profile-city">Default City / Area</label>
        <input
          id="customer-profile-city"
          type="text"
          value={form.defaultCity}
          onChange={(e) => setForm((f) => ({ ...f, defaultCity: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="customer-profile-landmark">Default Landmark</label>
        <input
          id="customer-profile-landmark"
          type="text"
          value={form.defaultLandmark}
          onChange={(e) => setForm((f) => ({ ...f, defaultLandmark: e.target.value }))}
        />
      </div>

      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      <div className="admin-actions">
        <button className="save-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </>
  );
}
