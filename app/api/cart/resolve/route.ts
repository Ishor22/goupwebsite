import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartResolveSchema } from '@/lib/validation';
import { DELIVERY_FEE_AED } from '@/lib/order';

// Public endpoint (guest carts are allowed) used purely to DISPLAY the cart
// with live prices/availability -- never trusted as the source of truth
// for an actual order. /api/orders re-does all of this from scratch.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = cartResolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { items } = parsed.data;
  if (items.length === 0) {
    return NextResponse.json({ items: [], subtotal: 0, deliveryFee: 0, total: 0 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      include: { brother: { select: { name: true } } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const resolvedItems = items.map((item) => {
      const product = byId.get(item.productId);
      if (!product || product.status !== 'PUBLISHED') {
        return { productId: item.productId, quantity: item.quantity, available: false as const };
      }
      const price = Number(product.price.toString());
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        available: true as const,
        name: product.name,
        price,
        imageUrl: product.imageUrl,
        brotherName: product.brother.name,
        lineTotal,
      };
    });

    const hasAvailableItems = resolvedItems.some((i) => i.available);
    const deliveryFee = hasAvailableItems ? DELIVERY_FEE_AED : 0;

    return NextResponse.json({
      items: resolvedItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load your cart right now. Please try again.' }, { status: 500 });
  }
}
