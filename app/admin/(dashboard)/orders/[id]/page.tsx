import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeOrder, serializeOrderItem } from '@/lib/order';
import OrderStatusControls from './OrderStatusControls';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: { include: { brother: { select: { name: true } } } },
    },
  });

  if (!order) {
    notFound();
  }

  const serialized = serializeOrder(order);
  const items = order.items.map(serializeOrderItem);

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Order #{serialized.orderNumber}</h1>
          <p className="dash-page-subtitle">Placed {new Date(serialized.createdAt).toLocaleString()}</p>
        </div>
        <a href="/admin/orders" className="cancel-button">
          Back to Orders
        </a>
      </div>

      <OrderStatusControls orderId={order.id} initialStatus={order.status} initialPaymentStatus={order.paymentStatus} />

      <div className="dash-section-card">
        <h2>Customer</h2>
        <p>{order.customer.name}</p>
        <p>{order.customer.email}</p>
        {order.customer.phone && <p>{order.customer.phone}</p>}
      </div>

      <div className="dash-section-card">
        <h2>Delivery</h2>
        <p>{serialized.customerName}</p>
        <p>{serialized.phone}</p>
        <p>{serialized.email}</p>
        <p>
          {serialized.deliveryAddress}, {serialized.city}
        </p>
        {serialized.landmark && <p>Landmark: {serialized.landmark}</p>}
        {serialized.note && <p>Note: {serialized.note}</p>}
      </div>

      <div className="dash-section-card">
        <h2>Products</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
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
                  <td data-label="Seller">{item.brother.name}</td>
                  <td data-label="Qty">{item.quantity}</td>
                  <td data-label="Unit Price">AED {item.productPriceSnapshot.toFixed(2)}</td>
                  <td data-label="Total">AED {item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-section-card">
        <h2>Price</h2>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>AED {serialized.subtotal.toFixed(2)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Delivery Fee</span>
            <span>AED {serialized.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Grand Total</span>
            <span>AED {serialized.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
