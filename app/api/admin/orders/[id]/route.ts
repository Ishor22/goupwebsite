import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { serializeOrder } from '@/lib/order';

const ORDER_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
]);
const PAYMENT_STATUSES = new Set(['PENDING', 'PAID', 'FAILED', 'REFUNDED']);

// Admin-only. This is the ONLY place order status or payment status can
// ever change -- customers have no endpoint for either, so a customer can
// never mark their own Cash-on-Delivery order as "paid".
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const data: { status?: string; paymentStatus?: string } = {};

  if (body?.status !== undefined) {
    if (typeof body.status !== 'string' || !ORDER_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body?.paymentStatus !== undefined) {
    if (typeof body.paymentStatus !== 'string' || !PAYMENT_STATUSES.has(body.paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }
    data.paymentStatus = body.paymentStatus;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({ where: { id: params.id }, data: data as any });
    return NextResponse.json({ order: serializeOrder(order) });
  } catch {
    return NextResponse.json({ error: 'Unable to update order. Please try again.' }, { status: 500 });
  }
}
