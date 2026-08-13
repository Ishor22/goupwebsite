import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toYouTubeEmbedUrl, getVideoDisplayKind } from '@/lib/video';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { brother: { select: { name: true } } },
  });

  if (!product || product.status !== 'PUBLISHED') {
    notFound();
  }

  const videoKind = product.videoUrl ? getVideoDisplayKind(product.videoUrl) : null;
  const embedUrl = videoKind === 'youtube' && product.videoUrl ? toYouTubeEmbedUrl(product.videoUrl) : null;

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>प्रदेशी दाजुभाइ समूह</h1>
          </div>
          <nav className="top-menu">
            <a href="/">गृहपृष्ठ</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="members container product-detail">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="product-detail-image" />
          )}
          <h2>{product.name}</h2>
          <p className="product-detail-price">AED {Number(product.price.toString()).toFixed(2)}</p>
          <p className="product-detail-brother">Published by: {product.brother.name}</p>
          {product.description && <p className="product-detail-description">{product.description}</p>}
          {videoKind === 'youtube' && embedUrl && (
            <div className="product-video-embed">
              <iframe
                src={embedUrl}
                title={product.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {videoKind === 'direct' && product.videoUrl && (
            <div className="product-video-embed">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={product.videoUrl} controls preload="metadata" />
            </div>
          )}
          {videoKind === 'link' && product.videoUrl && (
            <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className="save-button product-video-link">
              Watch Video
            </a>
          )}
        </section>
      </main>
      <footer>
        <div className="container">
          <p>© 2026 प्रदेशी दाजुभाइ समूह</p>
        </div>
      </footer>
    </>
  );
}
