import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <DashboardShell title="एडमिन प्यानल" userName={admin.name} role="admin" logoutHref="/api/admin/logout">
      <div className="dash-main-inner">{children}</div>
    </DashboardShell>
  );
}
