import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  BROTHER_SESSION_COOKIE_NAME,
  destroyBrotherSessionByToken,
  clearBrotherSessionCookie,
} from '@/lib/brotherAuth';

export async function POST() {
  const token = cookies().get(BROTHER_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroyBrotherSessionByToken(token);
  }
  clearBrotherSessionCookie();
  return NextResponse.json({ message: 'Logged out' });
}
