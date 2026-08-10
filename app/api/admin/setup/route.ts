import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';
import { setupSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    // Claiming the setup lock and creating the admin happen in one
    // transaction: if either step fails, both are rolled back together, so
    // a failed attempt never permanently locks out setup without an admin
    // actually existing. If the lock row already exists, someone (possibly
    // a concurrent request) has already completed setup.
    const admin = await prisma.$transaction(async (tx) => {
      await tx.setupLock.create({ data: { id: 1 } });
      return tx.admin.create({
        data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
      });
    });

    const { token, expiresAt } = await createSession(admin.id);
    setSessionCookie(token, expiresAt);

    return NextResponse.json({ message: 'Admin account created.' });
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes?.('id')) {
      return NextResponse.json({ error: 'Setup has already been completed.' }, { status: 403 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to create admin account. Please try again.' }, { status: 500 });
  }
}
