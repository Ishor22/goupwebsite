'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Profile = { email: string; bio: string | null; photoUrl: string | null };

export default function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: initialProfile.email,
    bio: initialProfile.bio || '',
    photoUrl: initialProfile.photoUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/brother/profile', {
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
        <label htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="profile-bio">Bio</label>
        <input
          id="profile-bio"
          type="text"
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="profile-photo">Photo URL</label>
        <input
          id="profile-photo"
          type="text"
          value={form.photoUrl}
          onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
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
