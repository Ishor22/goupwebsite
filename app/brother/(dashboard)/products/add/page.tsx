import { redirect } from 'next/navigation';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import ProductForm from '@/components/dashboard/ProductForm';

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Add Product</h1>
          <p className="dash-page-subtitle">नयाँ उत्पादन थप्नुहोस्</p>
        </div>
      </div>
      <ProductForm />
    </>
  );
}
