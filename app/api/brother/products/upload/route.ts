import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { uploadProductImage } from '@/lib/blob';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Kept comfortably under Vercel's serverless function request body limit
// (rather than the full 5MB a user might expect) so large-but-plausible
// phone photos fail with our clear error instead of a generic platform one.
const MAX_BYTES = 4 * 1024 * 1024;

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
    return NextResponse.json({ error: 'Image is too large. Please choose a file under 4 MB.' }, { status: 400 });
  }

  try {
    const url = await uploadProductImage(file, account.brotherId);
    return NextResponse.json({ url });
  } catch (error) {
    // Logged (not just swallowed) so the real cause -- e.g. a missing
    // BLOB_READ_WRITE_TOKEN -- is visible in Vercel's function logs
    // instead of only ever showing a generic message to the user.
    console.error('Product image upload failed:', error);
    return NextResponse.json({ error: 'Unable to upload image. Please try again.' }, { status: 500 });
  }
}
