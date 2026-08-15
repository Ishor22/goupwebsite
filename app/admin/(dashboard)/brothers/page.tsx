import { prisma } from '@/lib/prisma';
import BrothersManager from './BrothersManager';

export const dynamic = 'force-dynamic';

export default async function AdminBrothersPage() {
  const brothers = await prisma.brother.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      displayOrder: true,
      account: { select: { disabled: true, email: true } },
      _count: { select: { products: true } },
    },
  });

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Brothers</h1>
          <p className="dash-page-subtitle">दाजुभाइ समूह नाम सम्पादन गर्नुहोस्</p>
        </div>
      </div>
      <div className="dash-section-card">
        <BrothersManager
          initialBrothers={brothers.map((b) => ({
            id: b.id,
            name: b.name,
            displayOrder: b.displayOrder,
            email: b.account?.email ?? null,
            productCount: b._count.products,
            accountStatus: b.account ? (b.account.disabled ? 'disabled' : 'active') : 'none',
          }))}
        />
      </div>
    </>
  );
}
