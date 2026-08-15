import { getCurrentCustomer } from '@/lib/customerAuth';
import SiteNav from '@/components/shop/SiteNav';
import CartPageClient from '@/components/shop/CartPageClient';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const customer = await getCurrentCustomer();

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>प्रदेशी दाजुभाइ समूह</h1>
          </div>
          <SiteNav customerName={customer?.name ?? null} />
        </div>
      </header>
      <main>
        <section className="members container">
          <h2>Your Cart</h2>
          <CartPageClient customerLoggedIn={Boolean(customer)} />
        </section>
      </main>
      <footer>
        <div className="container">
          <p>© 2026 प्रदेशी दाजुभाइ समूह</p>
        </div>
      </footer>
    </>
  );
}
