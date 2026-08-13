import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { uploadProductVideo } from '@/lib/productVideo';

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
// Kept comfortably under Vercel's serverless function request body limit
// (a hard platform ceiling around 4.5MB that can't be raised) so a
// large-but-plausible phone video fails with our clear error instead of a
// generic platform one. Longer content should use a Video URL instead.
const MAX_BYTES = 4 * 1024 * 1024;

// Any logged-in brother can upload a file and get back a URL -- this
// endpoint doesn't touch any Product row itself, so it doesn't need to
// know or verify which product the video is for. Ownership of *which*
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
    return NextResponse.json({ error: 'No video file was provided.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only MP4, WEBM, or MOV video files are allowed.' },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'The selected file is empty.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Video is too large. Please choose a file under 4 MB, or use a Video URL instead.' },
      { status: 400 },
    );
  }

  try {
    const url = await uploadProductVideo(file, account.brotherId);
    return NextResponse.json({ url });
  } catch (error) {
    // Logged (not just swallowed) so the real cause -- e.g. a missing or
    // misconfigured Blob store -- is visible in Vercel's function logs
    // instead of only ever showing a generic message to the user.
    console.error('Product video upload failed:', error);
    return NextResponse.json({ error: 'Unable to upload video. Please try again.' }, { status: 500 });
  }
}
