'use client';

import { useState } from 'react';
import { getVideoDisplayKind, getYouTubeThumbnailUrl, withPosterFrame } from '@/lib/video';
import { isUploadedVideoUrl } from '@/lib/productMedia';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import EmptyState from '@/components/dashboard/EmptyState';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
};

function VideoThumb({ videoUrl, name }: { videoUrl: string; name: string }) {
  const kind = getVideoDisplayKind(videoUrl);
  if (kind === 'youtube') {
    const thumb = getYouTubeThumbnailUrl(videoUrl);
    if (thumb) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={thumb} alt={name} className="dash-table-thumb" loading="lazy" />;
    }
  }
  if (kind === 'direct') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={withPosterFrame(videoUrl)} className="dash-table-thumb" muted preload="metadata" />;
  }
  return <div className="dash-table-thumb dash-table-thumb-placeholder" aria-hidden="true" />;
}

export default function MyVideosManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Removing a video keeps the product itself -- only its video field is
  // cleared -- by resubmitting the product's own current fields through
  // the existing full-update endpoint with videoUrl blanked out. No new
  // API route needed.
  async function handleRemoveVideo(product: Product) {
    setBusyId(product.id);
    try {
      const response = await fetch(`/api/brother/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          price: product.price,
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          videoUrl: '',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to remove video. Please try again.');

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setMessage({ text: 'Video removed from product.', isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Unable to remove video. Please try again.', isError: true });
    } finally {
      setBusyId(null);
      setConfirmRemoveId(null);
    }
  }

  const removingProduct = products.find((p) => p.id === confirmRemoveId) || null;

  return (
    <>
      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      {products.length === 0 ? (
        <EmptyState
          message="No videos yet. Add a video when creating or editing a product."
          actionLabel="+ Add Product"
          actionHref="/brother/products/add"
        />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Video</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                if (!product.videoUrl) return null;
                const isBusy = busyId === product.id;
                const source = isUploadedVideoUrl(product.videoUrl) ? 'Uploaded' : 'URL';
                return (
                  <tr key={product.id}>
                    <td data-label="Video">
                      <div className="dash-table-name-cell">
                        <VideoThumb videoUrl={product.videoUrl} name={product.name} />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td data-label="Source">{source}</td>
                    <td data-label="Status">
                      <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
                        {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="dash-table-actions">
                        <a href={`/brother/products/${product.id}/edit`} className="cancel-button">
                          Edit
                        </a>
                        <button
                          className="delete-button"
                          onClick={() => setConfirmRemoveId(product.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? 'Removing...' : 'Delete Video'}
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

      {removingProduct && (
        <ConfirmDialog
          message={`Remove the video from "${removingProduct.name}"? The product itself will stay -- only its video is removed. This action cannot be undone.`}
          confirmLabel="Delete Video"
          busy={busyId === removingProduct.id}
          onConfirm={() => handleRemoveVideo(removingProduct)}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}
    </>
  );
}
