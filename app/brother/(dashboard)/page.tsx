import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeProduct } from '@/lib/product';
import StatCard from '@/components/dashboard/StatCard';
import EmptyState from '@/components/dashboard/EmptyState';

export const dynamic = 'force-dynamic';

export default async function BrotherDashboardHome() {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  const products = (
    await prisma.product.findMany({
      where: { brotherId: account.brotherId },
      orderBy: { createdAt: 'desc' },
    })
  ).map(serializeProduct);

  const published = products.filter((p) => p.status === 'PUBLISHED').length;
  const unpublished = products.filter((p) => p.status === 'UNPUBLISHED').length;
  const videos = products.filter((p) => p.videoUrl).length;
  const recentProducts = products.slice(0, 5);

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Welcome, {account.brother.name}</h1>
          <p className="dash-page-subtitle">Here&apos;s what&apos;s happening with your products</p>
        </div>
        <a href="/brother/products/add" className="save-button">
          + Add Product
        </a>
      </div>

      <div className="dash-stats-grid">
        <StatCard label="My Products" value={products.length} />
        <StatCard label="Published Products" value={published} />
        <StatCard label="Unpublished Products" value={unpublished} />
        <StatCard label="My Videos" value={videos} />
      </div>

      <div className="dash-section-card">
        <h2>Recent Products</h2>
        {recentProducts.length === 0 ? (
          <EmptyState message="कुनै उत्पादन थपिएको छैन।" actionLabel="+ Add Product" actionHref="/brother/products/add" />
        ) : (
          <ul className="dash-recent-list">
            {recentProducts.map((product) => (
              <li key={product.id} className="dash-recent-row">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="dash-table-thumb" loading="lazy" />
                ) : (
                  <div className="dash-table-thumb dash-table-thumb-placeholder" aria-hidden="true" />
                )}
                <div className="dash-recent-row-info">
                  <p className="dash-recent-row-name">{product.name}</p>
                  <p className="dash-recent-row-meta">AED {product.price.toFixed(2)}</p>
                </div>
                <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
                  {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
