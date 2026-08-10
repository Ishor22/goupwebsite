import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { brotherNameSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const brother = await prisma.brother.update({
      where: { id: params.id },
      data: { name: parsed.data },
      select: { id: true, name: true, displayOrder: true },
    });
    return NextResponse.json({ brother });
  } catch {
    return NextResponse.json({ error: 'Unable to update brother. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.brother.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Unable to delete brother. Please try again.' }, { status: 500 });
  }
}
