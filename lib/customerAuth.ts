import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { hashToken } from './auth';

// Deliberately separate from the admin and brother session systems
// (different cookie name, different table, different helpers) so a
// customer's login can never be confused with -- or accidentally grant --
// staff access.
export const CUSTOMER_SESSION_COOKIE_NAME = 'customer_session_token';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days -- shoppers expect to stay logged in
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.customerSession.create({
    data: { tokenHash: hashToken(token), customerId, expiresAt },
  });

  return { token, expiresAt };
}

export async function destroyCustomerSessionByToken(token: string) {
  await prisma.customerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

async function getCustomerForToken(token: string | undefined) {
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.customerSession.delete({ where: { id: session.id } });
    return null;
  }

  return session.customer;
}

// For use in Server Components / Route Handlers to find the logged-in
// customer from the request's cookies. Always re-verified against the
// database -- never trusts anything the client claims about itself.
export async function getCurrentCustomer() {
  const token = cookies().get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  return getCustomerForToken(token);
}

export function setCustomerSessionCookie(token: string, expiresAt: Date) {
  cookies().set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearCustomerSessionCookie() {
  cookies().delete(CUSTOMER_SESSION_COOKIE_NAME);
}

export function isLockedOut(customer: { lockedUntil: Date | null }) {
  return Boolean(customer.lockedUntil && customer.lockedUntil > new Date());
}

export async function registerFailedLogin(customer: { id: string; failedLoginAttempts: number }) {
  const attempts = customer.failedLoginAttempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

  await prisma.customer.update({
    where: { id: customer.id },
    data: { failedLoginAttempts: attempts, lockedUntil },
  });
}

export async function resetFailedLogins(customerId: string) {
  await prisma.customer.update({
    where: { id: customerId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}
