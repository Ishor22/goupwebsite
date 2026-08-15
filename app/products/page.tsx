import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import SiteNav from '@/components/shop/SiteNav';
import ProductCard from '@/components/shop/ProductCard';
import { serializeProduct } from '@/lib/product';

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
                <ProductCard key={product.id} product={serializeProduct(product)} showAddToCart />
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
