import { prisma } from '@/lib/prisma';
import { serializeProduct } from '@/lib/product';
import AdminProductsManager from './AdminProductsManager';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { brother: { select: { name: true } } },
  });

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Products</h1>
          <p className="dash-page-subtitle">Moderate every brother&apos;s products</p>
        </div>
      </div>
      <div className="dash-section-card">
        <AdminProductsManager initialProducts={products.map(serializeProduct)} />
      </div>
    </>
  );
}
