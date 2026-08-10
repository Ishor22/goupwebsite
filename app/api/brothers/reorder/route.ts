import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : null;
  const direction = body?.direction === 'up' || body?.direction === 'down' ? body.direction : null;
  if (!id || !direction) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const brothers = await prisma.brother.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, displayOrder: true },
    });

    const index = brothers.findIndex((b) => b.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Brother not found' }, { status: 404 });
    }

    const neighborIndex = direction === 'up' ? index - 1 : index + 1;
    if (neighborIndex < 0 || neighborIndex >= brothers.length) {
      return NextResponse.json({ error: 'Already at the edge of the list' }, { status: 400 });
    }

    const current = brothers[index];
    const neighbor = brothers[neighborIndex];

    await prisma.$transaction([
      prisma.brother.update({ where: { id: current.id }, data: { displayOrder: neighbor.displayOrder } }),
      prisma.brother.update({ where: { id: neighbor.id }, data: { displayOrder: current.displayOrder } }),
    ]);

    return NextResponse.json({ message: 'Reordered' });
  } catch {
    return NextResponse.json({ error: 'Unable to reorder. Please try again.' }, { status: 500 });
  }
}
