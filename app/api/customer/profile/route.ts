import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { customerProfileSchema } from '@/lib/validation';

// Only touches name/email/phone/default-address fields on Customer -- there
// is no field here that could let a customer change their id or become a
// Brother/Admin (those aren't columns on this model at all).
export async function PATCH(req: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = customerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  try {
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        defaultAddress: parsed.data.defaultAddress || null,
        defaultCity: parsed.data.defaultCity || null,
        defaultLandmark: parsed.data.defaultLandmark || null,
      },
      select: { name: true, email: true, phone: true, defaultAddress: true, defaultCity: true, defaultLandmark: true },
    });
    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to update profile. Please try again.' }, { status: 500 });
  }
}
