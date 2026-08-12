import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { productSchema } from '@/lib/validation';
import { serializeProduct } from '@/lib/product';

// Every handler below re-fetches the product and checks
// product.brotherId === account.brotherId on the server, regardless of
// what id is in the URL -- a brother can never modify or delete another
// brother's product, even by editing the URL or an API request directly.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing || existing.brotherId !== account.brotherId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        videoUrl: parsed.data.videoUrl || null,
      },
    });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return NextResponse.json({ error: 'Unable to update product. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing || existing.brotherId !== account.brotherId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Unable to delete product. Please try again.' }, { status: 500 });
  }
}
