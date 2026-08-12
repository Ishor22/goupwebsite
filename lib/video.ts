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
