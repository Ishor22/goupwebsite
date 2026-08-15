import { redirect } from 'next/navigation';
import { getCurrentBrotherAccount } from '@/lib/brotherAuth';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function BrotherProfilePage() {
  const account = await getCurrentBrotherAccount();
  if (!account) {
    redirect('/brother/login');
  }

  return (
    <>
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">My Profile</h1>
          <p className="dash-page-subtitle">{account.brother.name}</p>
        </div>
      </div>
      <div className="dash-section-card">
        <div className="dash-profile-card">
          {account.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={account.photoUrl} alt={account.brother.name} className="dash-profile-avatar" />
          ) : (
            <div className="dash-profile-avatar" aria-hidden="true" />
          )}
          <div>
            <h3>{account.brother.name}</h3>
            <span className={`account-status-badge account-status-${account.disabled ? 'disabled' : 'active'}`}>
              {account.disabled ? 'Account disabled' : 'Account active'}
            </span>
          </div>
        </div>
        <ProfileForm initialProfile={{ email: account.email, bio: account.bio, photoUrl: account.photoUrl }} />
      </div>
    </>
  );
}
