import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  hashRegistrationCode,
  createBrotherSession,
  setBrotherSessionCookie,
} from '@/lib/brotherAuth';
import { brotherRegistrationSchema } from '@/lib/validation';

// Public endpoint, but registration is NOT open: creating an account
// requires (1) an existing Brother row and (2) a valid, unused
// registration code the admin generated specifically for that brother.
// Knowing a brother's public name alone is never enough.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = brotherRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { brotherId, email, code, password } = parsed.data;

  try {
    const brother = await prisma.brother.findUnique({
      where: { id: brotherId },
      include: { account: true },
    });

    if (!brother) {
      return NextResponse.json({ error: 'Select a valid brother name.' }, { status: 400 });
    }

    if (brother.account) {
      return NextResponse.json(
        { error: 'This brother already has an account. Please log in.' },
        { status: 409 },
      );
    }

    const registrationCode = await prisma.registrationCode.findUnique({
      where: { codeHash: hashRegistrationCode(code) },
    });

    if (!registrationCode || registrationCode.brotherId !== brother.id || registrationCode.usedAt) {
      return NextResponse.json({ error: 'Invalid or already used registration code.' }, { status: 401 });
    }

    const passwordHash = await hashPassword(password);

    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.brotherAccount.create({
        data: { brotherId: brother.id, email, passwordHash },
      });
      await tx.registrationCode.update({
        where: { id: registrationCode.id },
        data: { usedAt: new Date() },
      });
      return created;
    });

    const { token, expiresAt } = await createBrotherSession(account.id);
    setBrotherSessionCookie(token, expiresAt);

    return NextResponse.json({ message: 'Account created.' });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to create account. Please try again.' }, { status: 500 });
  }
}
