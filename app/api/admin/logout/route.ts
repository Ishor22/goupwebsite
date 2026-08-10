import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, destroySessionByToken, clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySessionByToken(token);
  }
  clearSessionCookie();
  return NextResponse.json({ message: 'Logged out' });
}
