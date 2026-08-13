import { put, del } from '@vercel/blob';

// Unlike pictures (stored as base64 in Postgres, see lib/productImage.ts),
// uploaded videos are too large to embed in every page load, so they go to
// Vercel Blob -- a real, persistent object storage service. Only the
// resulting public URL is ever saved in the database.
export async function uploadProductVideo(file: File, brotherId: string) {
  const extension = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const pathname = `product-videos/${brotherId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type,
  });

  return blob.url;
}

// Best-effort cleanup: only ever attempts to delete URLs that actually
// look like ours, and never lets a failed deletion block the product
// operation (create/update/delete) that triggered it.
export async function deleteProductVideo(url: string | null | undefined) {
  if (!url) return;

  try {
    const { hostname } = new URL(url);
    if (!hostname.endsWith('.blob.vercel-storage.com')) return;
    await del(url);
  } catch {
    // Swallow -- orphaned blobs are a minor storage cost, not worth
    // failing a product save/delete over.
  }
}
