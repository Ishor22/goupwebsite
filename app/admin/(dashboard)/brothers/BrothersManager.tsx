'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import EmptyState from '@/components/dashboard/EmptyState';

type AccountStatus = 'none' | 'active' | 'disabled';
type Brother = {
  id: string;
  name: string;
  displayOrder: number;
  email: string | null;
  productCount: number;
  accountStatus: AccountStatus;
};

export default function BrothersManager({ initialBrothers }: { initialBrothers: Brother[] }) {
  const [brothers, setBrothers] = useState<Brother[]>(initialBrothers);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{ brotherId: string; code: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function showMessage(text: string, isError = false) {
    setMessage({ text, isError });
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

      setBrothers((prev) => [...prev, { ...result.brother, email: null, productCount: 0, accountStatus: 'none' }]);
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

      setBrothers((prev) => prev.map((b) => (b.id === id ? { ...b, name: result.brother.name } : b)));
      setEditingId(null);
      showMessage('Brother updated successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to update brother. Please try again.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
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
      setConfirmDeleteId(null);
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

  async function handleGenerateCode(id: string) {
    setBusyId(id);
    setGeneratedCode(null);
    try {
      const response = await fetch(`/api/brothers/${id}/registration-code`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to generate a registration code.');

      setGeneratedCode({ brotherId: id, code: result.code });
      showMessage('Registration code generated. Copy it now -- it will not be shown again.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to generate a registration code.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleAccount(id: string, disable: boolean) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/brothers/${id}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: disable }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update account.');

      setBrothers((prev) =>
        prev.map((b) => (b.id === id ? { ...b, accountStatus: disable ? 'disabled' : 'active' } : b)),
      );
      showMessage(disable ? 'Account disabled.' : 'Account enabled.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to update account.', true);
    } finally {
      setBusyId(null);
    }
  }

  const deletingBrother = brothers.find((b) => b.id === confirmDeleteId) || null;

  return (
    <>
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

      {brothers.length === 0 ? (
        <EmptyState message="कुनै दाजुभाइ छैनन्।" />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brothers.map((brother, index) => {
                const isEditing = editingId === brother.id;
                const isBusy = busyId === brother.id;

                return (
                  <tr key={brother.id}>
                    <td data-label="Order">
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
                    </td>
                    <td data-label="Name">
                      {isEditing ? (
                        <input
                          type="text"
                          className="admin-brother-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        brother.name
                      )}
                      {generatedCode?.brotherId === brother.id && (
                        <p className="registration-code-display">
                          Code: <strong>{generatedCode.code}</strong> -- give this to {brother.name} privately. It
                          will not be shown again.
                        </p>
                      )}
                    </td>
                    <td data-label="Email">{brother.email || '--'}</td>
                    <td data-label="Status">
                      <span className={`account-status-badge account-status-${brother.accountStatus}`}>
                        {brother.accountStatus === 'none' && 'No account'}
                        {brother.accountStatus === 'active' && 'Account active'}
                        {brother.accountStatus === 'disabled' && 'Account disabled'}
                      </span>
                    </td>
                    <td data-label="Products">{brother.productCount}</td>
                    <td data-label="Actions">
                      <div className="dash-table-actions">
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
                            {brother.accountStatus === 'none' && (
                              <button
                                className="save-button"
                                onClick={() => handleGenerateCode(brother.id)}
                                disabled={isBusy}
                              >
                                {isBusy ? 'Generating...' : 'Generate Code'}
                              </button>
                            )}
                            {brother.accountStatus === 'active' && (
                              <button
                                className="delete-button"
                                onClick={() => handleToggleAccount(brother.id, true)}
                                disabled={isBusy}
                              >
                                Disable
                              </button>
                            )}
                            {brother.accountStatus === 'disabled' && (
                              <button
                                className="save-button"
                                onClick={() => handleToggleAccount(brother.id, false)}
                                disabled={isBusy}
                              >
                                Enable
                              </button>
                            )}
                            <button
                              className="delete-button"
                              onClick={() => setConfirmDeleteId(brother.id)}
                              disabled={isBusy}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deletingBrother && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deletingBrother.name}"? This action cannot be undone.`}
          busy={busyId === deletingBrother.id}
          onConfirm={() => handleDelete(deletingBrother.id)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
