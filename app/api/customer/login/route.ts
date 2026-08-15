import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  createCustomerSession,
  setCustomerSessionCookie,
  isLockedOut,
  registerFailedLogin,
  resetFailedLogins,
} from '@/lib/customerAuth';
import { customerLoginSchema } from '@/lib/validation';

const GENERIC_ERROR = 'Invalid email or password.';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });

    if (!customer) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (isLockedOut(customer)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const passwordMatches = await verifyPassword(parsed.data.password, customer.passwordHash);
    if (!passwordMatches) {
      await registerFailedLogin(customer);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    await resetFailedLogins(customer.id);

    const { token, expiresAt } = await createCustomerSession(customer.id);
    setCustomerSessionCookie(token, expiresAt);

    return NextResponse.json({ message: 'Logged in' });
  } catch {
    return NextResponse.json({ error: 'Unable to log in right now. Please try again.' }, { status: 500 });
  }
}
