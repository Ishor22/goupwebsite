import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createCustomerSession, setCustomerSessionCookie } from '@/lib/customerAuth';
import { customerRegistrationSchema } from '@/lib/validation';

// Public and open -- unlike brother registration, a customer account needs
// no invitation code from the admin. Anyone can create one.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = customerRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { name, email, phone, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const customer = await prisma.customer.create({
      data: { name, email, phone, passwordHash },
    });

    const { token, expiresAt } = await createCustomerSession(customer.id);
    setCustomerSessionCookie(token, expiresAt);

    return NextResponse.json({ message: 'Account created.' });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to create account. Please try again.' }, { status: 500 });
  }
}
