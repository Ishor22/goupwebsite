// Nav configuration (including icon component references) lives here and
// is only ever imported from DashboardShell, a Client Component -- icon
// functions can't be passed as props across the Server -> Client boundary,
// so the layout.tsx Server Components just pass a `role` string instead.
import { IconDashboard, IconBrothers, IconProducts, IconVideos, IconProfile, IconPlus } from './icons';
import type { NavSection } from './DashboardShell';

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  { items: [{ href: '/admin', label: 'Dashboard', icon: IconDashboard }] },
  {
    title: 'Management',
    items: [
      { href: '/admin/brothers', label: 'Brothers', icon: IconBrothers },
      { href: '/admin/products', label: 'Products', icon: IconProducts },
      { href: '/admin/videos', label: 'Videos', icon: IconVideos },
    ],
  },
  { title: 'Account', items: [{ href: '/admin/profile', label: 'Profile', icon: IconProfile }] },
];

export const BROTHER_NAV_SECTIONS: NavSection[] = [
  { items: [{ href: '/brother', label: 'Dashboard', icon: IconDashboard }] },
  {
    title: 'My Business',
    items: [
      { href: '/brother/products', label: 'My Products', icon: IconProducts },
      { href: '/brother/products/add', label: 'Add Product', icon: IconPlus },
      { href: '/brother/videos', label: 'My Videos', icon: IconVideos },
    ],
  },
  { title: 'Account', items: [{ href: '/brother/profile', label: 'My Profile', icon: IconProfile }] },
];
