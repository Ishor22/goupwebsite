import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { checkoutSchema } from '@/lib/validation';
import { DELIVERY_FEE_AED, generateOrderNumber, serializeOrder } from '@/lib/order';

const DUPLICATE_WINDOW_MS = 15_000;

export async function POST(req: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: 'Please log in to place an order.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { items, customerName, phone, email, deliveryAddress, city, landmark, note } = parsed.data;

  try {
    // Re-verify every product against the database -- price, seller, and
    // availability are never taken from the request body. Anything the
    // browser sent for those fields (it sends none) would be ignored.
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const unavailable = items.filter((item) => {
      const product = byId.get(item.productId);
      return !product || product.status !== 'PUBLISHED';
    });
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: 'Sorry, one or more items in your cart are no longer available. Please review your cart and try again.' },
        { status: 409 },
      );
    }

    let subtotal = 0;
    const lineItems = items.map((item) => {
      const product = byId.get(item.productId)!;
      const price = Number(product.price.toString());
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        brotherId: product.brotherId,
        productNameSnapshot: product.name,
        productPriceSnapshot: price,
        productImageSnapshot: product.imageUrl,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const deliveryFee = DELIVERY_FEE_AED;
    const total = subtotal + deliveryFee;

    // Basic duplicate-submission guard: if this same customer already has an
    // order for the exact same total placed in the last few seconds, treat
    // a repeat request (e.g. a double click that raced past the disabled
    // button) as the same order rather than creating a second one.
    const recentDuplicate = await prisma.order.findFirst({
      where: {
        customerId: customer.id,
        total,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    if (recentDuplicate && recentDuplicate.items.length === lineItems.length) {
      return NextResponse.json({ order: serializeOrder(recentDuplicate) });
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx);
      return tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          paymentMethod: 'COD',
          subtotal,
          deliveryFee,
          total,
          customerName,
          phone,
          email,
          deliveryAddress,
          city,
          landmark: landmark || null,
          note: note || null,
          items: { create: lineItems },
        },
      });
    });

    return NextResponse.json({ order: serializeOrder(order) });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong while placing your order. Please try again.' },
      { status: 500 },
    );
  }
}
