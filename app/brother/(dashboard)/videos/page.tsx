import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeProduct } from '@/lib/product';
import MyVideosManager from './MyVideosManager';

export const dynamic = 'force-dynamic';

export default async function MyVideosPage() {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  const products = await prisma.product.findMany({
    where: { brotherId: account.brotherId, videoUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">My Videos</h1>
          <p className="dash-page-subtitle">Videos attached to your products</p>
        </div>
        <a href="/brother/products/add" className="save-button">
          + Add Product
        </a>
      </div>
      <div className="dash-section-card">
        <MyVideosManager initialProducts={products.map(serializeProduct)} />
      </div>
    </>
  );
}
