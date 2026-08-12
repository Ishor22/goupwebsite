import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { hashToken } from './auth';

// Deliberately separate from the admin session system (different cookie
// name, different table, different helpers) so a brother's login can never
// be confused with -- or accidentally grant -- admin access.
export const BROTHER_SESSION_COOKIE_NAME = 'brother_session_token';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createBrotherSession(brotherAccountId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.brotherSession.create({
    data: { tokenHash: hashToken(token), brotherAccountId, expiresAt },
  });

  return { token, expiresAt };
}

export async function destroyBrotherSessionByToken(token: string) {
  await prisma.brotherSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

async function getBrotherAccountForToken(token: string | undefined) {
  if (!token) return null;

  const session = await prisma.brotherSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { brotherAccount: { include: { brother: true } } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date() || session.brotherAccount.disabled) {
    // An expired session is cleaned up here; a disabled account is treated
    // as logged-out on every request, not just at the moment it was
    // disabled, so an admin disabling an account takes effect immediately.
    if (session.expiresAt < new Date()) {
      await prisma.brotherSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session.brotherAccount;
}

// For use in Server Components / Route Handlers to find the logged-in
// brother account from the request's cookies. Always re-verified against
// the database -- never trusts anything the client claims about itself.
export async function getCurrentBrotherAccount() {
  const token = cookies().get(BROTHER_SESSION_COOKIE_NAME)?.value;
  return getBrotherAccountForToken(token);
}

export function setBrotherSessionCookie(token: string, expiresAt: Date) {
  cookies().set(BROTHER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearBrotherSessionCookie() {
  cookies().delete(BROTHER_SESSION_COOKIE_NAME);
}

export function isLockedOut(account: { lockedUntil: Date | null }) {
  return Boolean(account.lockedUntil && account.lockedUntil > new Date());
}

export async function registerFailedLogin(account: { id: string; failedLoginAttempts: number }) {
  const attempts = account.failedLoginAttempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

  await prisma.brotherAccount.update({
    where: { id: account.id },
    data: { failedLoginAttempts: attempts, lockedUntil },
  });
}

export async function resetFailedLogins(accountId: string) {
  await prisma.brotherAccount.update({
    where: { id: accountId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

// Registration codes: a random human-typeable code shown to the admin once.
// Only its hash is ever stored, matching how session tokens and passwords
// are handled -- a database leak alone can't be used to register accounts.
export function generateRegistrationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid transcription mistakes
  const random = (n: number) =>
    Array.from({ length: n }, () => alphabet[randomBytes(1)[0] % alphabet.length]).join('');
  return `${random(4)}-${random(4)}`;
}

export function hashRegistrationCode(code: string) {
  return hashToken(code.trim().toUpperCase());
}
