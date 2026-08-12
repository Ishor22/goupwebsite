import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeProduct } from '@/lib/product';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';

export default async function BrotherDashboardPage() {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  const products = await prisma.product.findMany({
    where: { brotherId: account.brotherId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>दाजुभाइ ड्यासबोर्ड</h1>
            <p className="subtitle">{account.brother.name}</p>
          </div>
          <nav className="top-menu">
            <a href="/">गृहपृष्ठ</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          <Dashboard
            brotherName={account.brother.name}
            initialProfile={{ email: account.email, bio: account.bio, photoUrl: account.photoUrl }}
            initialProducts={products.map(serializeProduct)}
          />
        </section>
      </main>
    </>
  );
}
