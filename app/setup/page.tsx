import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect('/admin');
  }

  const adminCount = await prisma.admin.count();

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>पहिलो एडमिन सेटअप</h1>
            <p className="subtitle">समूह</p>
          </div>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          {adminCount > 0 ? (
            <div className="setup-disabled">
              <p>Setup has already been completed. An administrator account already exists.</p>
              <p>
                Go to <a href="/admin/login">/admin/login</a> to log in.
              </p>
            </div>
          ) : (
            <SetupForm />
          )}
        </section>
      </main>
    </>
  );
}
