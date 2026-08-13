// Pure, dependency-free classification helpers shared by client components
// (Dashboard, AdminProducts) and server code alike. Deliberately kept free
// of any Node-only or server-only imports (unlike lib/productImage.ts and
// lib/productVideo.ts, which pull in Buffer and @vercel/blob) so importing
// this file never drags server-only code into a client bundle.
export function isUploadedImageUrl(value: string): boolean {
  return value.startsWith('data:');
}

export function isUploadedVideoUrl(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
