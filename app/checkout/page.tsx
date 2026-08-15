import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/customerAuth';
import SiteNav from '@/components/shop/SiteNav';
import CheckoutForm from '@/components/shop/CheckoutForm';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect('/customer/login?redirect=/checkout');
  }

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>प्रदेशी दाजुभाइ समूह</h1>
          </div>
          <SiteNav customerName={customer.name} />
        </div>
      </header>
      <main>
        <section className="members container">
          <h2>Checkout</h2>
          <CheckoutForm
            customer={{
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              defaultAddress: customer.defaultAddress,
              defaultCity: customer.defaultCity,
              defaultLandmark: customer.defaultLandmark,
            }}
          />
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
