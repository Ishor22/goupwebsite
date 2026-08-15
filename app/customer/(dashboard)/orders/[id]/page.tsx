import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { serializeOrder, serializeOrderItem } from '@/lib/order';

export const dynamic = 'force-dynamic';

export default async function CustomerOrderDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCurrentCustomer();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { brother: { select: { name: true } } } } },
  });

  // A customer may only ever view their own orders -- direct URL guessing
  // of another customer's order id must 404, not leak any data.
  if (!order || order.customerId !== customer!.id) {
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
        <a href="/customer/orders" className="cancel-button">
          Back to My Orders
        </a>
      </div>

      <div className="dash-section-card">
        <h2>Order Information</h2>
        <p>
          Status:{' '}
          <span className={`order-status-badge order-status-${serialized.status.toLowerCase()}`}>
            {serialized.status.replace(/_/g, ' ')}
          </span>
        </p>
        <p>Payment Method: Cash on Delivery</p>
        <p>
          Payment Status:{' '}
          <span className={`payment-status-badge payment-status-${serialized.paymentStatus.toLowerCase()}`}>
            {serialized.paymentStatus}
          </span>
        </p>
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
