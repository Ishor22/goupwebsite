import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/customerAuth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const customer = await getCurrentCustomer();
  if (customer) {
    redirect('/customer');
  }

  const redirectTo = searchParams.redirect && searchParams.redirect.startsWith('/') ? searchParams.redirect : null;
  const registerHref = redirectTo ? `/customer/register?redirect=${encodeURIComponent(redirectTo)}` : '/customer/register';

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>Customer Login</h1>
            <p className="subtitle">प्रदेशी दाजुभाइ समूह</p>
          </div>
          <nav className="top-menu">
            <a href="/">Home</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          <LoginForm />
          <p className="admin-panel-note">
            Don&apos;t have an account? <a href={registerHref}>Create one here</a>.
          </p>
        </section>
      </main>
    </>
  );
}
