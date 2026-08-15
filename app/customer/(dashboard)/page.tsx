import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { serializeOrder } from '@/lib/order';
import StatCard from '@/components/dashboard/StatCard';
import EmptyState from '@/components/dashboard/EmptyState';
import CartCountStat from '@/components/shop/CartCountStat';

export const dynamic = 'force-dynamic';

export default async function CustomerDashboardHome() {
  const customer = await getCurrentCustomer();
  const orders = (
    await prisma.order.findMany({
      where: { customerId: customer!.id },
      orderBy: { createdAt: 'desc' },
    })
  ).map(serializeOrder);

  const pending = orders.filter((o) => o.status === 'PENDING').length;
  const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const recentOrders = orders.slice(0, 5);

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Dashboard</h1>
          <p className="dash-page-subtitle">Welcome, {customer!.name}</p>
        </div>
      </div>

      <div className="dash-stats-grid">
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Pending Orders" value={pending} />
        <StatCard label="Delivered Orders" value={delivered} />
        <CartCountStat />
      </div>

      <div className="dash-section-card">
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <EmptyState message="You haven't placed any orders yet." actionLabel="Start Shopping" actionHref="/products" />
        ) : (
          <ul className="dash-recent-list">
            {recentOrders.map((order) => (
              <li key={order.id} className="dash-recent-row">
                <div className="dash-recent-row-info">
                  <p className="dash-recent-row-name">Order #{order.orderNumber}</p>
                  <p className="dash-recent-row-meta">
                    AED {order.total.toFixed(2)} -- Cash on Delivery
                  </p>
                </div>
                <span className={`order-status-badge order-status-${order.status.toLowerCase()}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <a href={`/customer/orders/${order.id}`} className="cancel-button">
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
