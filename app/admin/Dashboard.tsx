'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Brother = { id: string; name: string; displayOrder: number };

export default function Dashboard({
  adminName,
  initialBrothers,
}: {
  adminName: string;
  initialBrothers: Brother[];
}) {
  const router = useRouter();
  const [brothers, setBrothers] = useState<Brother[]>(initialBrothers);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  function showMessage(text: string, isError = false) {
    setMessage({ text, isError });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) {
      showMessage('कम्तिमा एक नाम लेख्नुहोस्।', true);
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/brothers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to add brother. Please try again.');

      setBrothers((prev) => [...prev, result.brother]);
      setNewName('');
      showMessage('Brother added successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to add brother. Please try again.', true);
    } finally {
      setAdding(false);
    }
  }

  function startEdit(brother: Brother) {
    setEditingId(brother.id);
    setEditValue(brother.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: string) {
    const name = editValue.trim();
    if (!name) {
      showMessage('नाम खाली हुन सक्दैन।', true);
      return;
    }

    setBusyId(id);
    try {
      const response = await fetch(`/api/brothers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update brother. Please try again.');

      setBrothers((prev) => prev.map((b) => (b.id === id ? result.brother : b)));
      setEditingId(null);
      showMessage('Brother updated successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to update brother. Please try again.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this brother?')) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/brothers/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete brother. Please try again.');

      setBrothers((prev) => prev.filter((b) => b.id !== id));
      showMessage('Brother deleted successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to delete brother. Please try again.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    setBusyId(id);
    try {
      const response = await fetch('/api/brothers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to reorder. Please try again.');

      setBrothers((prev) => {
        const index = prev.findIndex((b) => b.id === id);
        const neighborIndex = direction === 'up' ? index - 1 : index + 1;
        if (index === -1 || neighborIndex < 0 || neighborIndex >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[neighborIndex]] = [next[neighborIndex], next[index]];
        return next;
      });
    } catch (err: any) {
      showMessage(err.message || 'Unable to reorder. Please try again.', true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <h2>Welcome, {adminName}</h2>
        <button className="cancel-button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="new-brother-name">नयाँ दाजुभाइको नाम थप्नुहोस्</label>
        <div className="inline-form">
          <input
            id="new-brother-name"
            type="text"
            placeholder="नाम लेख्नुहोस्"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={adding}
          />
          <button className="save-button" onClick={handleAdd} disabled={adding}>
            {adding ? 'Saving...' : 'Add Brother'}
          </button>
        </div>
      </div>

      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      <ul className="admin-brothers-list">
        {brothers.length === 0 && <li>कुनै दाजुभाइ छैनन्।</li>}
        {brothers.map((brother, index) => {
          const isEditing = editingId === brother.id;
          const isBusy = busyId === brother.id;

          return (
            <li key={brother.id} className="admin-brother-row">
              <div className="admin-brother-order">
                <button
                  type="button"
                  className="order-button"
                  onClick={() => handleReorder(brother.id, 'up')}
                  disabled={index === 0 || isBusy}
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="order-button"
                  onClick={() => handleReorder(brother.id, 'down')}
                  disabled={index === brothers.length - 1 || isBusy}
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  className="admin-brother-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                />
              ) : (
                <span className="admin-brother-name">{brother.name}</span>
              )}

              <div className="admin-brother-actions">
                {isEditing ? (
                  <>
                    <button className="save-button" onClick={() => saveEdit(brother.id)} disabled={isBusy}>
                      {isBusy ? 'Saving...' : 'Save'}
                    </button>
                    <button className="cancel-button" onClick={cancelEdit} disabled={isBusy}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="cancel-button" onClick={() => startEdit(brother)} disabled={isBusy}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(brother.id)} disabled={isBusy}>
                      {isBusy ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
