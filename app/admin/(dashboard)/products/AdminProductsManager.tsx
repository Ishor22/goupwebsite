'use client';

import { useState } from 'react';
import { isUploadedImageUrl, isUploadedVideoUrl } from '@/lib/productMedia';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import EmptyState from '@/components/dashboard/EmptyState';
import { IconSearch } from '@/components/dashboard/icons';

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  videoUrl: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: string;
  brother: { name: string };
};

function mediaSourceLabel(value: string | null, isUploaded: (v: string) => boolean): string | null {
  if (!value) return null;
  return isUploaded(value) ? 'Uploaded' : 'URL';
}

export default function AdminProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      setConfirmDeleteId(null);
    }
  }

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.brother.name.toLowerCase().includes(q);
  });
  const deletingProduct = products.find((p) => p.id === confirmDeleteId) || null;

  return (
    <>
      <div className="dash-search-bar">
        <IconSearch />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product or brother name"
          aria-label="Search products"
        />
      </div>

      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      {filtered.length === 0 ? (
        <EmptyState message={products.length === 0 ? 'No products yet.' : 'No products match your search.'} />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brother</th>
                <th>Price</th>
                <th>Media</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const isBusy = busyId === product.id;
                const imageSource = mediaSourceLabel(product.imageUrl, isUploadedImageUrl);
                const videoSource = mediaSourceLabel(product.videoUrl, isUploadedVideoUrl);
                return (
                  <tr key={product.id}>
                    <td data-label="Product">
                      <div className="dash-table-name-cell">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt={product.name} className="dash-table-thumb" loading="lazy" />
                        ) : (
                          <div className="dash-table-thumb dash-table-thumb-placeholder" aria-hidden="true" />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td data-label="Brother">{product.brother.name}</td>
                    <td data-label="Price">AED {product.price.toFixed(2)}</td>
                    <td data-label="Media" className="admin-product-media-source">
                      {imageSource ? `Picture: ${imageSource}` : 'No picture'}
                      {' · '}
                      {videoSource ? `Video: ${videoSource}` : 'No video'}
                    </td>
                    <td data-label="Status">
                      <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
                        {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="dash-table-actions">
                        <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" className="cancel-button">
                          View
                        </a>
                        <button className="cancel-button" onClick={() => handleToggleStatus(product)} disabled={isBusy}>
                          {product.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="delete-button" onClick={() => setConfirmDeleteId(product.id)} disabled={isBusy}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deletingProduct && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deletingProduct.name}"? This action cannot be undone.`}
          busy={busyId === deletingProduct.id}
          onConfirm={() => handleDelete(deletingProduct.id)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
