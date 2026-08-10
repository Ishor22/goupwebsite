import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let brothers: { id: string; name: string }[] = [];
  let loadError = false;

  try {
    brothers = await prisma.brother.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true },
    });
  } catch {
    loadError = true;
  }

  return (
    <>
      <header>
        <div className="container header-flex">
          <div>
            <h1>प्रदेशी दाजुभाइ समूह</h1>
          </div>
          <nav className="top-menu">
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="members container">
          <h2>दाजुभाइहरू</h2>
          <ol>
            {loadError && <li>सूची लोड गर्न सकिएन। पछि फेरि प्रयास गर्नुहोस्।</li>}
            {!loadError && brothers.length === 0 && <li>कुनै दाजुभाइ छैनन्।</li>}
            {!loadError && brothers.map((brother) => <li key={brother.id}>{brother.name}</li>)}
          </ol>
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
