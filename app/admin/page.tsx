import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { serializeProduct } from '@/lib/product';
import Dashboard from './Dashboard';
import AdminProducts from './AdminProducts';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const brothers = await prisma.brother.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      displayOrder: true,
      account: { select: { disabled: true } },
    },
  });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { brother: { select: { name: true } } },
  });

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>एडमिन प्यानल</h1>
            <p className="subtitle">दाजुभाइ समूह नाम सम्पादन गर्नुहोस्</p>
          </div>
          <nav className="top-menu">
            <a href="/">गृहपृष्ठ</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          <Dashboard
            adminName={admin.name}
            initialBrothers={brothers.map((b) => ({
              id: b.id,
              name: b.name,
              displayOrder: b.displayOrder,
              accountStatus: b.account ? (b.account.disabled ? 'disabled' : 'active') : 'none',
            }))}
          />
        </section>
        <section className="admin-panel container">
          <AdminProducts initialProducts={products.map(serializeProduct)} />
        </section>
      </main>
    </>
  );
}
