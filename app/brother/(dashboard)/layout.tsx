import { redirect } from 'next/navigation';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function BrotherDashboardLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  return (
    <DashboardShell
      title="दाजुभाइ ड्यासबोर्ड"
      userName={account.brother.name}
      role="brother"
      logoutHref="/api/brother/logout"
    >
      <div className="dash-main-inner">{children}</div>
    </DashboardShell>
  );
}
