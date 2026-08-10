import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  isLockedOut,
  registerFailedLogin,
  resetFailedLogins,
} from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

const GENERIC_ERROR = 'Invalid email or password.';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
    if (!admin) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (isLockedOut(admin)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const passwordMatches = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!passwordMatches) {
      await registerFailedLogin(admin);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    await resetFailedLogins(admin.id);

    const { token, expiresAt } = await createSession(admin.id);
    setSessionCookie(token, expiresAt);

    return NextResponse.json({ message: 'Logged in' });
  } catch {
    return NextResponse.json({ error: 'Unable to log in right now. Please try again.' }, { status: 500 });
  }
}
