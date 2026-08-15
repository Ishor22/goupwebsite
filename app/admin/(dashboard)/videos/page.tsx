import { prisma } from '@/lib/prisma';
import { serializeProduct } from '@/lib/product';
import AdminVideosManager from './AdminVideosManager';

export const dynamic = 'force-dynamic';

export default async function AdminVideosPage() {
  const products = await prisma.product.findMany({
    where: { videoUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
    include: { brother: { select: { name: true } } },
  });

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Videos</h1>
          <p className="dash-page-subtitle">Every product that includes a video</p>
        </div>
      </div>
      <div className="dash-section-card">
        <AdminVideosManager initialProducts={products.map(serializeProduct)} />
      </div>
    </>
  );
}
