'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useCart } from './CartContext';

type Customer = {
  name: string;
  email: string;
  phone: string | null;
  defaultAddress: string | null;
  defaultCity: string | null;
  defaultLandmark: string | null;
};

type ResolveResponse = {
  items: Array<{ productId: string; available: boolean }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

type OrderResult = {
  orderNumber: string;
  total: number;
  deliveryAddress: string;
  city: string;
};

export default function CheckoutForm({ customer }: { customer: Customer }) {
  const { items, clear } = useCart();
  const [preview, setPreview] = useState<ResolveResponse | null>(null);
  const [form, setForm] = useState({
    customerName: customer.name,
    phone: customer.phone || '',
    email: customer.email,
    deliveryAddress: customer.defaultAddress || '',
    city: customer.defaultCity || '',
    landmark: customer.defaultLandmark || '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    fetch('/api/cart/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => setPreview(data))
      .catch(() => {});
  }, [items]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, ...form }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong while placing your order. Please try again.');
      }

      clear();
      setOrderResult(result.order);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while placing your order. Please try again.');
      setSubmitting(false);
    }
  }

  if (orderResult) {
    return (
      <div className="order-confirmation">
        <h2>Order Placed Successfully!</h2>
        <p className="order-confirmation-number">Order Number: {orderResult.orderNumber}</p>
        <p>Payment: Cash on Delivery</p>
        <p>Total: AED {orderResult.total.toFixed(2)}</p>
        <p>
          Delivery Address: {orderResult.deliveryAddress}, {orderResult.city}
        </p>
        <div className="admin-actions">
          <a href="/customer/orders" className="save-button">
            View My Orders
          </a>
          <a href="/products" className="cancel-button">
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="dash-empty-state">
        <p>Your cart is empty.</p>
        <a href="/products" className="save-button">
          Continue Shopping
        </a>
      </div>
    );
  }

  const unavailableCount = preview?.items.filter((i) => !i.available).length ?? 0;

  return (
    <div className="checkout-layout">
      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="dash-section-card">
          <h2>Customer Information</h2>
          <div className="form-group">
            <label htmlFor="checkout-name">Full Name</label>
            <input
              id="checkout-name"
              type="text"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkout-phone">Phone Number</label>
            <input
              id="checkout-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkout-email">Email</label>
            <input
              id="checkout-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkout-address">Delivery Address</label>
            <input
              id="checkout-address"
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkout-city">City / Area</label>
            <input
              id="checkout-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkout-landmark">Landmark (optional)</label>
            <input
              id="checkout-landmark"
              type="text"
              value={form.landmark}
              onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkout-note">Order Note (optional)</label>
            <input
              id="checkout-note"
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <div className="dash-section-card">
          <h2>Payment Method</h2>
          <label className="payment-method-option">
            <input type="radio" checked readOnly />
            Cash on Delivery
          </label>
          <p className="admin-panel-note">Pay cash when your order is delivered.</p>
        </div>

        {error && <p className="admin-message error">{error}</p>}

        <div className="admin-actions">
          <button type="submit" className="save-button" disabled={submitting || unavailableCount === items.length}>
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>

      <div className="checkout-summary dash-section-card">
        <h2>Order Summary</h2>
        {unavailableCount > 0 && (
          <p className="admin-message error">
            {unavailableCount === 1
              ? 'One item in your cart is no longer available and will be skipped.'
              : `${unavailableCount} items in your cart are no longer available and will be skipped.`}
          </p>
        )}
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>AED {(preview?.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Delivery Fee</span>
            <span>AED {(preview?.deliveryFee ?? 0).toFixed(2)}</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Grand Total</span>
            <span>AED {(preview?.total ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
