import { redirect } from 'next/navigation';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function BrotherLoginPage() {
  const account = await getCurrentBrotherAccount();
  if (account) {
    redirect('/brother');
  }

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>दाजुभाइ लगइन</h1>
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
          <p className="admin-panel-note">
            खाता छैन? यदि तपाईं भाइहरूको सूचीमा हुनुहुन्छ भने, एडमिनसँग दर्ता कोड माग्नुहोस् र{' '}
            <a href="/register">यहाँ खाता बनाउनुहोस्</a>।
          </p>
        </section>
      </main>
    </>
  );
}
