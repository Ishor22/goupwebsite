import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeOrderItem } from '@/lib/order';

export const dynamic = 'force-dynamic';

// Privacy: a brother must only ever see (a) orders that contain at least
// one of his own products, and (b) only his own line items within that
// order -- never another brother's products, prices, or totals. Both are
// enforced server-side below, not just hidden in the markup.
export default async function BrotherOrderDetailPage({ params }: { params: { id: string } }) {
  const account = await getCurrentBrotherAccount();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { brother: { select: { name: true } } } } },
  });

  const ownItems = order?.items.filter((item) => item.brotherId === account!.brotherId) ?? [];
  if (!order || ownItems.length === 0) {
    notFound();
  }

  const serializedItems = ownItems.map(serializeOrderItem);
  const yourTotal = serializedItems.reduce((sum, i) => sum + i.lineTotal, 0);

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Order #{order.orderNumber}</h1>
          <p className="dash-page-subtitle">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <a href="/brother/orders" className="cancel-button">
          Back to Orders
        </a>
      </div>

      <div className="dash-section-card">
        <h2>Order Status</h2>
        <span className={`order-status-badge order-status-${order.status.toLowerCase()}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="dash-section-card">
        <h2>Delivery</h2>
        <p>{order.customerName}</p>
        <p>{order.phone}</p>
        <p>
          {order.deliveryAddress}, {order.city}
        </p>
        {order.landmark && <p>Landmark: {order.landmark}</p>}
      </div>

      <div className="dash-section-card">
        <h2>Your Products in This Order</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {serializedItems.map((item) => (
                <tr key={item.id}>
                  <td data-label="Product">
                    <div className="dash-table-name-cell">
                      {item.productImageSnapshot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.productImageSnapshot}
                          alt={item.productNameSnapshot}
                          className="dash-table-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="dash-table-thumb dash-table-thumb-placeholder" aria-hidden="true" />
                      )}
                      <span>{item.productNameSnapshot}</span>
                    </div>
                  </td>
                  <td data-label="Qty">{item.quantity}</td>
                  <td data-label="Unit Price">AED {item.productPriceSnapshot.toFixed(2)}</td>
                  <td data-label="Total">AED {item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dash-page-subtitle">Your Items Total: AED {yourTotal.toFixed(2)}</p>
      </div>
    </>
  );
}
