import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import SiteNav from '@/components/shop/SiteNav';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, customer] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: { brother: { select: { name: true } } },
    }),
    getCurrentCustomer(),
  ]);

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
        <section className="members container products-section">
          <h2>All Products</h2>
          {products.length === 0 ? (
            <p>No products are available yet. Please check back soon.</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <a key={product.id} href={`/products/${product.id}`} className="product-card">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="product-card-image" loading="lazy" />
                  ) : (
                    <div className="product-card-image product-card-image-placeholder" aria-hidden="true" />
                  )}
                  <div className="product-card-body">
                    <p className="product-card-name">{product.name}</p>
                    <p className="product-card-price">AED {Number(product.price.toString()).toFixed(2)}</p>
                    <p className="product-card-brother">Published by: {product.brother.name}</p>
                    {product.videoUrl && <span className="product-card-video-badge">Watch Video</span>}
                  </div>
                </a>
              ))}
            </div>
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
