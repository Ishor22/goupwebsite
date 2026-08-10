import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { brotherNameSchema } from '@/lib/validation';

export async function GET() {
  try {
    const brothers = await prisma.brother.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, displayOrder: true },
    });
    return NextResponse.json({ brothers });
  } catch {
    return NextResponse.json({ error: 'Unable to load brothers. Please try again.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = brotherNameSchema.safeParse(body?.name);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid name' }, { status: 400 });
  }

  try {
    const maxOrder = await prisma.brother.aggregate({ _max: { displayOrder: true } });
    const brother = await prisma.brother.create({
      data: { name: parsed.data, displayOrder: (maxOrder._max.displayOrder ?? 0) + 1 },
      select: { id: true, name: true, displayOrder: true },
    });
    return NextResponse.json({ brother });
  } catch {
    return NextResponse.json({ error: 'Unable to add brother. Please try again.' }, { status: 500 });
  }
}
