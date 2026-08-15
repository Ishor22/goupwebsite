import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/customerAuth';
import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const customer = await getCurrentCustomer();
  if (customer) {
    redirect('/customer');
  }

  const redirectTo = searchParams.redirect && searchParams.redirect.startsWith('/') ? searchParams.redirect : null;
  const loginHref = redirectTo ? `/customer/login?redirect=${encodeURIComponent(redirectTo)}` : '/customer/login';

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>Create an Account</h1>
            <p className="subtitle">प्रदेशी दाजुभाइ समूह</p>
          </div>
          <nav className="top-menu">
            <a href="/">Home</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          <RegisterForm loginHref={loginHref} />
        </section>
      </main>
    </>
  );
}
