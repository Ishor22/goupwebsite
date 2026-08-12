import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  createBrotherSession,
  setBrotherSessionCookie,
  isLockedOut,
  registerFailedLogin,
  resetFailedLogins,
} from '@/lib/brotherAuth';
import { brotherLoginSchema } from '@/lib/validation';

const GENERIC_ERROR = 'Invalid email or password.';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = brotherLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  try {
    const account = await prisma.brotherAccount.findUnique({
      where: { email: parsed.data.email },
      include: { brother: true },
    });

    if (!account) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (account.disabled) {
      return NextResponse.json(
        { error: 'This account has been disabled. Please contact the admin.' },
        { status: 403 },
      );
    }

    if (isLockedOut(account)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const passwordMatches = await verifyPassword(parsed.data.password, account.passwordHash);
    if (!passwordMatches) {
      await registerFailedLogin(account);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    await resetFailedLogins(account.id);

    const { token, expiresAt } = await createBrotherSession(account.id);
    setBrotherSessionCookie(token, expiresAt);

    return NextResponse.json({ message: 'Logged in' });
  } catch {
    return NextResponse.json({ error: 'Unable to log in right now. Please try again.' }, { status: 500 });
  }
}
