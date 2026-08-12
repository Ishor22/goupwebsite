'use client';

import { useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: string;
  brother: { name: string };
};

export default function AdminProducts({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function showMessage(text: string, isError = false) {
    setMessage({ text, isError });
  }

  async function handleToggleStatus(product: Product) {
    const nextStatus = product.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    setBusyId(product.id);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update product.');

      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)));
      showMessage(nextStatus === 'PUBLISHED' ? 'Product published.' : 'Product unpublished.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to update product.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete product.');

      setProducts((prev) => prev.filter((p) => p.id !== id));
      showMessage('Product deleted.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to delete product.', true);
    } finally {
      setBusyId(null);
    }
  }

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.brother.name.toLowerCase().includes(q);
  });

  return (
    <>
      <h2>Products</h2>
      <div className="form-group">
        <label htmlFor="product-search">Search products</label>
        <input
          id="product-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product or brother name"
        />
      </div>

      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      <ul className="admin-product-list">
        {filtered.length === 0 && <li>No products found.</li>}
        {filtered.map((product) => {
          const isBusy = busyId === product.id;
          return (
            <li key={product.id} className="admin-product-row">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="admin-product-thumb" loading="lazy" />
              ) : (
                <div className="admin-product-thumb admin-product-thumb-placeholder" aria-hidden="true" />
              )}
              <div className="admin-product-info">
                <span className="admin-product-name">{product.name}</span>
                <span className="admin-product-price">AED {product.price.toFixed(2)}</span>
                <span className="admin-product-brother">by {product.brother.name}</span>
                <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
                  {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
                </span>
              </div>
              <div className="admin-brother-actions">
                <button className="cancel-button" onClick={() => handleToggleStatus(product)} disabled={isBusy}>
                  {product.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>
                <button className="delete-button" onClick={() => handleDelete(product.id)} disabled={isBusy}>
                  {isBusy ? 'Working...' : 'Delete'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
