import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  destroyCustomerSessionByToken,
  clearCustomerSessionCookie,
} from '@/lib/customerAuth';

export async function POST() {
  const token = cookies().get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroyCustomerSessionByToken(token);
  }
  clearCustomerSessionCookie();
  return NextResponse.json({ message: 'Logged out' });
}
