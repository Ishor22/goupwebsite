import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateRegistrationCode, hashRegistrationCode } from '@/lib/brotherAuth';

// Admin-only. Generates a fresh code for a brother who doesn't have an
// account yet, invalidating any previously generated (unused) codes for
// that brother first so only one code is ever valid at a time. The
// plaintext code is returned in this single response and is never
// retrievable again -- only its hash is stored.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brother = await prisma.brother.findUnique({
      where: { id: params.id },
      include: { account: true },
    });

    if (!brother) {
      return NextResponse.json({ error: 'Brother not found' }, { status: 404 });
    }

    if (brother.account) {
      return NextResponse.json({ error: 'This brother already has an account.' }, { status: 409 });
    }

    const code = generateRegistrationCode();

    await prisma.$transaction([
      prisma.registrationCode.deleteMany({ where: { brotherId: brother.id, usedAt: null } }),
      prisma.registrationCode.create({
        data: { brotherId: brother.id, codeHash: hashRegistrationCode(code) },
      }),
    ]);

    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: 'Unable to generate a registration code. Please try again.' }, { status: 500 });
  }
}
