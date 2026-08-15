import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toYouTubeEmbedUrl, getVideoDisplayKind, withPosterFrame } from '@/lib/video';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { serializeProduct } from '@/lib/product';
import SiteNav from '@/components/shop/SiteNav';
import AddToCartControl from '@/components/shop/AddToCartControl';
import ProductCard from '@/components/shop/ProductCard';
import RecentVideoCard from '@/components/shop/RecentVideoCard';

export const dynamic = 'force-dynamic';

// Bounded pools, not "fetch everything then slice in JS on the whole
// table" -- both queries use the existing status+createdAt index and stay
// small regardless of how many products/videos exist.
const RELATED_POOL_LIMIT = 30;
const RELATED_TAKE = 6;
const RECENT_TAKE = 6;
const VIDEOS_TAKE = 6;
const MIN_RELATED_BEFORE_FALLBACK = 4;

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, customer] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { brother: { select: { name: true } } },
    }),
    getCurrentCustomer(),
  ]);

  if (!product || product.status !== 'PUBLISHED') {
    notFound();
  }

  const [otherProductsPool, recentVideoProducts] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'PUBLISHED', id: { not: product.id } },
      orderBy: { createdAt: 'desc' },
      take: RELATED_POOL_LIMIT,
      include: { brother: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { status: 'PUBLISHED', id: { not: product.id }, videoUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: VIDEOS_TAKE,
      include: { brother: { select: { name: true } } },
    }),
  ]);

  // "Related" = same seller, since the Product model has no category field
  // to key off of -- a reasonable, existing-data-only stand-in for
  // relevance. Tops up from the general recent pool when a brother simply
  // doesn't have enough other products yet.
  const sameSeller = otherProductsPool.filter((p) => p.brotherId === product.brotherId);
  const relatedProducts =
    sameSeller.length >= MIN_RELATED_BEFORE_FALLBACK
      ? sameSeller.slice(0, RELATED_TAKE)
      : [
          ...sameSeller,
          ...otherProductsPool.filter((p) => p.brotherId !== product.brotherId).slice(0, RELATED_TAKE - sameSeller.length),
        ];

  const usedIds = new Set([product.id, ...relatedProducts.map((p) => p.id)]);
  const recentProducts = otherProductsPool.filter((p) => !usedIds.has(p.id)).slice(0, RECENT_TAKE);

  const videoKind = product.videoUrl ? getVideoDisplayKind(product.videoUrl) : null;
  const embedUrl = videoKind === 'youtube' && product.videoUrl ? toYouTubeEmbedUrl(product.videoUrl) : null;

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>प्रदेशी दाजुभाइ समूह</h1>
          </div>
          <SiteNav customerName={customer?.name ?? null} />
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
          <AddToCartControl productId={product.id} />
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
              <video src={withPosterFrame(product.videoUrl)} controls preload="metadata" />
            </div>
          )}
          {videoKind === 'link' && product.videoUrl && (
            <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className="save-button product-video-link">
              Watch Video
            </a>
          )}
        </section>

        {relatedProducts.length > 0 && (
          <section className="members container products-section">
            <h2>You May Also Like</h2>
            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={serializeProduct(p)} showAddToCart />
              ))}
            </div>
            <a href="/products" className="cancel-button view-all-link">
              View All Products
            </a>
          </section>
        )}

        {recentProducts.length > 0 && (
          <section className="members container products-section">
            <h2>Recent Products</h2>
            <div className="product-grid">
              {recentProducts.map((p) => (
                <ProductCard key={p.id} product={serializeProduct(p)} showAddToCart />
              ))}
            </div>
            <a href="/products" className="cancel-button view-all-link">
              View All Products
            </a>
          </section>
        )}

        {recentVideoProducts.length > 0 && (
          <section className="members container videos-section">
            <h2>Recent Videos</h2>
            <div className="recent-video-grid">
              {recentVideoProducts.map((p) => (
                <RecentVideoCard
                  key={p.id}
                  product={{ id: p.id, name: p.name, videoUrl: p.videoUrl!, brother: p.brother }}
                />
              ))}
            </div>
            <a href="/#videos-section" className="cancel-button view-all-link">
              View All Videos
            </a>
          </section>
        )}
      </main>
      <footer>
        <div className="container">
          <p>© 2026 प्रदेशी दाजुभाइ समूह</p>
        </div>
      </footer>
    </>
  );
}
