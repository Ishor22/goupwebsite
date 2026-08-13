import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { serializeProduct } from '@/lib/product';
import { deleteProductVideo } from '@/lib/productVideo';

// Admin-only management of ANY product (unlike /api/brother/products/[id],
// which only lets a brother touch his own). Used for publish/unpublish and
// moderation from the admin dashboard.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== 'PUBLISHED' && status !== 'UNPUBLISHED') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return NextResponse.json({ error: 'Unable to update product. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: params.id } });
    await deleteProductVideo(existing.videoUrl);

    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Unable to delete product. Please try again.' }, { status: 500 });
  }
}
