import { getCurrentCustomer } from '@/lib/customerAuth';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function CustomerProfilePage() {
  const customer = await getCurrentCustomer();

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">My Profile</h1>
        </div>
      </div>

      <div className="dash-section-card">
        <div className="dash-profile-card">
          <div className="dash-profile-avatar" aria-hidden="true" />
          <div>
            <h3>{customer!.name}</h3>
            <p className="dash-recent-row-meta">{customer!.email}</p>
          </div>
        </div>

        <ProfileForm
          initialProfile={{
            name: customer!.name,
            email: customer!.email,
            phone: customer!.phone,
            defaultAddress: customer!.defaultAddress,
            defaultCity: customer!.defaultCity,
            defaultLandmark: customer!.defaultLandmark,
          }}
        />
      </div>
    </>
  );
}
