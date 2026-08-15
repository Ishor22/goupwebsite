import { prisma } from '@/lib/prisma';
import { serializeOrder } from '@/lib/order';
import AdminOrdersManager from './AdminOrdersManager';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { name: true, phone: true } }, items: { select: { id: true } } },
  });

  const serialized = orders.map((order) => ({
    ...serializeOrder(order),
    customer: order.customer,
    itemCount: order.items.length,
  }));

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Orders</h1>
          <p className="dash-page-subtitle">All customer orders across the marketplace</p>
        </div>
      </div>

      <AdminOrdersManager initialOrders={serialized} />
    </>
  );
}
