import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/customerAuth';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect('/customer/login');
  }

  return (
    <DashboardShell title="My Account" userName={customer.name} role="customer" logoutHref="/api/customer/logout">
      <div className="dash-main-inner">{children}</div>
    </DashboardShell>
  );
}
