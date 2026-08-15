import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeProduct } from '@/lib/product';
import MyProductsManager from './MyProductsManager';

export const dynamic = 'force-dynamic';

export default async function MyProductsPage() {
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
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">My Products</h1>
          <p className="dash-page-subtitle">मेरा उत्पादनहरू</p>
        </div>
        <a href="/brother/products/add" className="save-button">
          + Add Product
        </a>
      </div>
      <div className="dash-section-card">
        <MyProductsManager initialProducts={products.map(serializeProduct)} />
      </div>
    </>
  );
}
