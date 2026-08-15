'use client';

import { useEffect, useState } from 'react';
import { useCart } from './CartContext';

type ResolvedItem =
  | { productId: string; quantity: number; available: false }
  | {
      productId: string;
      quantity: number;
      available: true;
      name: string;
      price: number;
      imageUrl: string | null;
      brotherName: string;
      lineTotal: number;
    };

type ResolveResponse = {
  items: ResolvedItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export default function CartPageClient({ customerLoggedIn }: { customerLoggedIn: boolean }) {
  const { items, setQuantity, removeItem, clear } = useCart();
  const [resolved, setResolved] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/cart/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setError('');
          setResolved(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load your cart right now. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (loading && !resolved) {
    return <p>Loading your cart...</p>;
  }

  if (error) {
    return <p className="admin-message error">{error}</p>;
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

  const unavailableCount = resolved?.items.filter((i) => !i.available).length ?? 0;

  return (
    <>
      {unavailableCount > 0 && (
        <p className="admin-message error">
          {unavailableCount === 1
            ? 'One item in your cart is no longer available and will not be included in your order.'
            : `${unavailableCount} items in your cart are no longer available and will not be included in your order.`}
        </p>
      )}

      <div className="dash-table-wrap">
        <table className="dash-table cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {resolved?.items.map((item) =>
              item.available ? (
                <tr key={item.productId}>
                  <td data-label="Product">
                    <div className="dash-table-name-cell">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="dash-table-thumb" loading="lazy" />
                      ) : (
                        <div className="dash-table-thumb dash-table-thumb-placeholder" aria-hidden="true" />
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td data-label="Seller">{item.brotherName}</td>
                  <td data-label="Price">AED {item.price.toFixed(2)}</td>
                  <td data-label="Qty">
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => setQuantity(item.productId, Math.min(99, item.quantity + 1))}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td data-label="Total">AED {item.lineTotal.toFixed(2)}</td>
                  <td data-label="Remove">
                    <button type="button" className="delete-button" onClick={() => removeItem(item.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={item.productId}>
                  <td data-label="Product" colSpan={4}>
                    <em>This product is no longer available.</em>
                  </td>
                  <td data-label="Remove">
                    <button type="button" className="delete-button" onClick={() => removeItem(item.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span>AED {(resolved?.subtotal ?? 0).toFixed(2)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery Fee</span>
          <span>AED {(resolved?.deliveryFee ?? 0).toFixed(2)}</span>
        </div>
        <div className="cart-summary-row cart-summary-total">
          <span>Grand Total</span>
          <span>AED {(resolved?.total ?? 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="admin-actions">
        <button type="button" className="cancel-button" onClick={clear}>
          Clear Cart
        </button>
        <a
          href={customerLoggedIn ? '/checkout' : '/customer/login?redirect=/checkout'}
          className="save-button"
        >
          Proceed to Checkout
        </a>
      </div>
    </>
  );
}
