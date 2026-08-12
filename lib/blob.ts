import { put, del } from '@vercel/blob';

// Vercel's filesystem (including /tmp) is not persistent between requests
// or deployments, so uploaded product pictures are stored with Vercel
// Blob instead -- a real, persistent object storage service. Only the
// resulting public URL is ever saved in the database; the binary image
// data itself never touches Postgres.
export async function uploadProductImage(file: File, brotherId: string) {
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const pathname = `products/${brotherId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type,
  });

  return blob.url;
}

// Best-effort cleanup: only ever attempts to delete URLs that actually
// look like ours, and never lets a failed deletion block the product
// operation (create/update/delete) that triggered it.
export async function deleteProductImage(url: string | null | undefined) {
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
