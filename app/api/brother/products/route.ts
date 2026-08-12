import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { productSchema } from '@/lib/validation';
import { serializeProduct } from '@/lib/product';

export async function POST(req: NextRequest) {
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
    // brotherId always comes from the verified session, never from the
    // request body -- a brother can only ever create products for himself.
    const product = await prisma.product.create({
      data: {
        brotherId: account.brotherId,
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        videoUrl: parsed.data.videoUrl || null,
      },
    });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return NextResponse.json({ error: 'Unable to add product. Please try again.' }, { status: 500 });
  }
}
