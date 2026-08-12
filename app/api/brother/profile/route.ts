import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { brotherProfileSchema } from '@/lib/validation';

// Deliberately only touches email/bio/photoUrl on BrotherAccount -- there is
// no field here that could let a brother change which Brother row they're
// linked to (that identity link is set once at registration and is not
// exposed as editable input anywhere in this handler).
export async function PATCH(req: NextRequest) {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = brotherProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  try {
    const updated = await prisma.brotherAccount.update({
      where: { id: account.id },
      data: {
        email: parsed.data.email,
        bio: parsed.data.bio || null,
        photoUrl: parsed.data.photoUrl || null,
      },
      select: { email: true, bio: true, photoUrl: true },
    });
    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to update profile. Please try again.' }, { status: 500 });
  }
}
