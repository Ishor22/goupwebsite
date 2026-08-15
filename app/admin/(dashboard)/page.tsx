import { prisma } from '@/lib/prisma';
import StatCard from '@/components/dashboard/StatCard';
import EmptyState from '@/components/dashboard/EmptyState';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardHome() {
  const [brothers, products] = await Promise.all([
    prisma.brother.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, createdAt: true, account: { select: { disabled: true } } },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { brother: { select: { name: true } } },
    }),
  ]);

  const activeBrothers = brothers.filter((b) => b.account && !b.account.disabled).length;
  const disabledBrothers = brothers.filter((b) => b.account?.disabled).length;
  const published = products.filter((p) => p.status === 'PUBLISHED').length;
  const unpublished = products.filter((p) => p.status === 'UNPUBLISHED').length;
  const totalVideos = products.filter((p) => p.videoUrl).length;

  const recentProducts = products.slice(0, 5);
  const recentBrothers = [...brothers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Dashboard</h1>
          <p className="dash-page-subtitle">Overview of your Daju Bhai Group site</p>
        </div>
      </div>

      <div className="dash-stats-grid">
        <StatCard label="Total Brothers" value={brothers.length} />
        <StatCard label="Active Brothers" value={activeBrothers} />
        <StatCard label="Disabled Brothers" value={disabledBrothers} />
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Published Products" value={published} />
        <StatCard label="Unpublished Products" value={unpublished} />
        <StatCard label="Total Videos" value={totalVideos} />
      </div>

      <div className="dash-section-card">
        <h2>Recent Products</h2>
        {recentProducts.length === 0 ? (
          <EmptyState message="No products yet." />
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
                  <p className="dash-recent-row-meta">
                    by {product.brother.name} -- AED {Number(product.price.toString()).toFixed(2)}
                  </p>
                </div>
                <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
                  {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dash-section-card">
        <h2>Recent Brothers</h2>
        {recentBrothers.length === 0 ? (
          <EmptyState message="No brothers yet." />
        ) : (
          <ul className="dash-recent-list">
            {recentBrothers.map((brother) => (
              <li key={brother.id} className="dash-recent-row">
                <div className="dash-recent-row-info">
                  <p className="dash-recent-row-name">{brother.name}</p>
                </div>
                <span
                  className={`account-status-badge account-status-${
                    brother.account ? (brother.account.disabled ? 'disabled' : 'active') : 'none'
                  }`}
                >
                  {brother.account ? (brother.account.disabled ? 'Account disabled' : 'Account active') : 'No account'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
