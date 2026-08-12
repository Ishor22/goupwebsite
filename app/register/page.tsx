import { prisma } from '@/lib/prisma';
import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const brothers = await prisma.brother.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true },
  });

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>दाजुभाइ खाता खोल्नुहोस्</h1>
            <p className="subtitle">समूह</p>
          </div>
          <nav className="top-menu">
            <a href="/">गृहपृष्ठ</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="admin-panel container">
          <p className="admin-panel-note">
            यो खाता केवल भाइहरूको सूचीमा भएका दाजुभाइहरूका लागि हो। खाता खोल्नको लागि एडमिनले
            दिएको दर्ता कोड आवश्यक छ।
          </p>
          <RegisterForm brothers={brothers} />
        </section>
      </main>
    </>
  );
}
