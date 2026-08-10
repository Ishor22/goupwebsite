import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect('/admin');
  }

  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    redirect('/setup');
  }

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>एडमिन लगइन</h1>
            <p className="subtitle">समूह</p>
          </div>
          <nav className="top-menu">
            <a href="/">गृहपृष्ठ</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          <LoginForm />
        </section>
      </main>
    </>
  );
}
