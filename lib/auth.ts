import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Exported so lib/brotherAuth.ts can reuse the same opaque-token hashing
// scheme for brother sessions instead of duplicating it.
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

// Creates a new opaque, high-entropy session token. Only its SHA-256 hash
// is stored in the database -- the raw token itself lives only in the
// admin's browser cookie, so a database leak alone can't be used to log in.
export async function createSession(adminId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), adminId, expiresAt },
  });

  return { token, expiresAt };
}

export async function destroySessionByToken(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

async function getAdminForToken(token: string | undefined) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.admin;
}

// For use in Server Components / Route Handlers to find the logged-in
// admin from the request's cookies. Always re-verified against the
// database -- never trusts anything the client claims about itself.
export async function getCurrentAdmin() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return getAdminForToken(token);
}

export function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export function isLockedOut(admin: { lockedUntil: Date | null }) {
  return Boolean(admin.lockedUntil && admin.lockedUntil > new Date());
}

export async function registerFailedLogin(admin: { id: string; failedLoginAttempts: number }) {
  const attempts = admin.failedLoginAttempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

  await prisma.admin.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: attempts, lockedUntil },
  });
}

export async function resetFailedLogins(adminId: string) {
  await prisma.admin.update({
    where: { id: adminId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}
