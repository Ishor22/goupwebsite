import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

// Admin-only. Enables or disables the account linked to a brother.
// Disabling takes effect immediately: getCurrentBrotherAccount() re-checks
// the disabled flag on every request, not just at login, so an active
// session is cut off the very next time that brother's browser makes a
// request -- it doesn't have to wait for the session to expire naturally.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const disabled = body?.disabled;
  if (typeof disabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const brother = await prisma.brother.findUnique({
      where: { id: params.id },
      include: { account: true },
    });

    if (!brother?.account) {
      return NextResponse.json({ error: 'This brother does not have an account yet.' }, { status: 404 });
    }

    await prisma.brotherAccount.update({
      where: { id: brother.account.id },
      data: { disabled },
    });

    return NextResponse.json({ message: disabled ? 'Account disabled.' : 'Account enabled.' });
  } catch {
    return NextResponse.json({ error: 'Unable to update account. Please try again.' }, { status: 500 });
  }
}
