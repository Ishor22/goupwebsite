// Converts common YouTube URL formats into an embeddable iframe src.
// Returns null for anything else (including non-YouTube video links), so
// callers can fall back to a plain "Watch Video" link instead -- we don't
// try to download, host, or otherwise handle arbitrary video files.
export function toYouTubeEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.pathname.startsWith('/embed/')) {
      return `https://www.youtube.com${parsed.pathname}`;
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  }

  return null;
}

export type VideoDisplayKind = 'youtube' | 'direct' | 'link';

// A video our own upload flow stored always lives on Vercel Blob and always
// is a direct playable file; a pasted link only counts as "direct" if it
// obviously points at a video file, so an arbitrary webpage link still
// falls back to a plain "Watch Video" link instead of a broken <video> tag.
const DIRECT_VIDEO_EXTENSION = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

export function getVideoDisplayKind(url: string): VideoDisplayKind {
  if (toYouTubeEmbedUrl(url)) return 'youtube';

  try {
    const { hostname, pathname } = new URL(url);
    if (hostname.endsWith('.blob.vercel-storage.com') || DIRECT_VIDEO_EXTENSION.test(pathname)) {
      return 'direct';
    }
  } catch {
    // Falls through to 'link' below.
  }

  return 'link';
}
