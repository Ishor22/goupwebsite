import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeOrderItem } from '@/lib/order';
import EmptyState from '@/components/dashboard/EmptyState';

export const dynamic = 'force-dynamic';

// A brother only ever sees orders that contain his own products, and only
// his own line items within them -- enforced here by filtering on
// brotherId at the database query, never by hiding rows in the UI.
export default async function BrotherOrdersPage() {
  const account = await getCurrentBrotherAccount();
  const items = await prisma.orderItem.findMany({
    where: { brotherId: account!.brotherId },
    include: { order: { select: { id: true, orderNumber: true, status: true, createdAt: true } } },
    orderBy: { order: { createdAt: 'desc' } },
  });

  const byOrder = new Map<string, { orderNumber: string; status: string; createdAt: Date; items: typeof items }>();
  for (const item of items) {
    const existing = byOrder.get(item.order.id);
    if (existing) {
      existing.items.push(item);
    } else {
      byOrder.set(item.order.id, {
        orderNumber: item.order.orderNumber,
        status: item.order.status,
        createdAt: item.order.createdAt,
        items: [item],
      });
    }
  }
  const orders = Array.from(byOrder.entries()).map(([orderId, data]) => {
    const serializedItems = data.items.map(serializeOrderItem);
    return {
      orderId,
      orderNumber: data.orderNumber,
      status: data.status,
      createdAt: data.createdAt.toISOString(),
      yourTotal: serializedItems.reduce((sum, i) => sum + i.lineTotal, 0),
      itemCount: serializedItems.reduce((sum, i) => sum + i.quantity, 0),
    };
  });

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Orders</h1>
          <p className="dash-page-subtitle">Orders that include your products</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="No orders yet." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Your Items</th>
                <th>Your Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td data-label="Order">{order.orderNumber}</td>
                  <td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td data-label="Your Items">{order.itemCount}</td>
                  <td data-label="Your Total">AED {order.yourTotal.toFixed(2)}</td>
                  <td data-label="Status">
                    <span className={`order-status-badge order-status-${order.status.toLowerCase()}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <a href={`/brother/orders/${order.orderId}`} className="cancel-button">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
