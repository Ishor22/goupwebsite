import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { serializeOrder } from '@/lib/order';
import EmptyState from '@/components/dashboard/EmptyState';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersPage() {
  const customer = await getCurrentCustomer();
  const orders = (
    await prisma.order.findMany({
      where: { customerId: customer!.id },
      orderBy: { createdAt: 'desc' },
    })
  ).map(serializeOrder);

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">My Orders</h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="You haven't placed any orders yet." actionLabel="Start Shopping" actionHref="/products" />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">{order.orderNumber}</td>
                  <td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td data-label="Total">AED {order.total.toFixed(2)}</td>
                  <td data-label="Payment">
                    Cash on Delivery
                    <span className={`payment-status-badge payment-status-${order.paymentStatus.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={`order-status-badge order-status-${order.status.toLowerCase()}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <a href={`/customer/orders/${order.id}`} className="cancel-button">
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
