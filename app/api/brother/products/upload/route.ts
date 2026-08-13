import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { encodeProductImage } from '@/lib/productImage';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Kept small because the encoded picture is stored directly in the
// database and sent down with every page that shows it (homepage,
// dashboards, product page) -- unlike object storage, a large image here
// makes every one of those pages slower to load, not just the upload.
const MAX_BYTES = 1.5 * 1024 * 1024;

// Any logged-in brother can upload a file and get back a URL -- this
// endpoint doesn't touch any Product row itself, so it doesn't need to
// know or verify which product the image is for. Ownership of *which*
// product ends up with that URL is enforced separately, by the existing
// server-side checks in /api/brother/products and
// /api/brother/products/[id] when the URL is actually saved.
export async function POST(req: NextRequest) {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPG, PNG, or WEBP image files are allowed.' },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'The selected file is empty.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image is too large. Please choose a file under 1.5 MB.' }, { status: 400 });
  }

  try {
    const url = await encodeProductImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Product image upload failed:', error);
    return NextResponse.json({ error: 'Unable to upload image. Please try again.' }, { status: 500 });
  }
}
