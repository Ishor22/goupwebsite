import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Profile</h1>
          <p className="dash-page-subtitle">Your admin account</p>
        </div>
      </div>
      <div className="dash-section-card">
        <div className="dash-profile-card">
          <div className="dash-profile-avatar" aria-hidden="true" />
          <div>
            <h3>{admin.name}</h3>
            <p className="dash-page-subtitle">{admin.email}</p>
          </div>
        </div>
      </div>
    </>
  );
}
