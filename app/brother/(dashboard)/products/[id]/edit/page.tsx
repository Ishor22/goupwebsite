import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import { serializeProduct } from '@/lib/product';
import ProductForm from '@/components/dashboard/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  // A brother can only ever reach their own product's edit page -- even
  // with the id from another brother's product typed straight into the
  // URL, this renders the same 404 as a nonexistent id. The actual save
  // is re-verified server-side again in the API route regardless.
  if (!product || product.brotherId !== account.brotherId) {
    notFound();
  }

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Edit Product</h1>
          <p className="dash-page-subtitle">{product.name}</p>
        </div>
      </div>
      <ProductForm product={serializeProduct(product)} />
    </>
  );
}
