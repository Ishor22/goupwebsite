'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import EmptyState from '@/components/dashboard/EmptyState';

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: string;
};

export default function MyProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/brother/products/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete product. Please try again.');

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMessage({ text: 'Product deleted successfully.', isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Unable to delete product. Please try again.', isError: true });
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  const deletingProduct = products.find((p) => p.id === confirmDeleteId) || null;

  return (
    <>
      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      {products.length === 0 ? (
        <EmptyState message="कुनै उत्पादन थपिएको छैन।" actionLabel="+ Add Product" actionHref="/brother/products/add" />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isBusy = busyId === product.id;
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
                    <td data-label="Price">AED {product.price.toFixed(2)}</td>
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
                        <a href={`/brother/products/${product.id}/edit`} className="cancel-button">
                          Edit
                        </a>
                        <button className="delete-button" onClick={() => setConfirmDeleteId(product.id)} disabled={isBusy}>
                          {isBusy ? 'Deleting...' : 'Delete'}
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
