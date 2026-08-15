'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export default function OrderStatusControls({
  orderId,
  initialStatus,
  initialPaymentStatus,
}: {
  orderId: string;
  initialStatus: string;
  initialPaymentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function update(field: 'status' | 'paymentStatus', value: string) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update order. Please try again.');

      if (field === 'status') setStatus(value);
      else setPaymentStatus(value);
      setMessage({ text: 'Order updated.', isError: false });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Unable to update order. Please try again.', isError: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-section-card">
      <h2>Manage Order</h2>
      <div className="form-group">
        <label htmlFor="order-status-select">Order Status</label>
        <select
          id="order-status-select"
          value={status}
          onChange={(e) => update('status', e.target.value)}
          disabled={saving}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="payment-status-select">Payment Status</label>
        <select
          id="payment-status-select"
          value={paymentStatus}
          onChange={(e) => update('paymentStatus', e.target.value)}
          disabled={saving}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}
    </div>
  );
}
