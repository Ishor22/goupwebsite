import { getVideoDisplayKind, getYouTubeThumbnailUrl, withPosterFrame } from '@/lib/video';

export type RecentVideoData = {
  id: string;
  name: string;
  videoUrl: string;
  brother: { name: string };
};

// A lightweight thumbnail card (no live iframe/player) for browsing many
// videos at once -- reuses the same YouTube static-thumbnail helper the
// admin/brother Videos pages already use instead of embedding a player per
// card. Clicking always opens the product page, same as a product card.
export default function RecentVideoCard({ product }: { product: RecentVideoData }) {
  const kind = getVideoDisplayKind(product.videoUrl);
  const youtubeThumb = kind === 'youtube' ? getYouTubeThumbnailUrl(product.videoUrl) : null;

  return (
    <a href={`/products/${product.id}`} className="recent-video-card">
      <div className="recent-video-card-thumb">
        {youtubeThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={youtubeThumb} alt={product.name} loading="lazy" />
        ) : kind === 'direct' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={withPosterFrame(product.videoUrl)} muted preload="metadata" />
        ) : (
          <div className="recent-video-card-thumb-placeholder" aria-hidden="true" />
        )}
        <span className="recent-video-card-play" aria-hidden="true">
          ▶
        </span>
      </div>
      <p className="recent-video-card-name">{product.name}</p>
      <p className="recent-video-card-brother">{product.brother.name}</p>
    </a>
  );
}
