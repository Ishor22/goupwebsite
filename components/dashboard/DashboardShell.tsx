'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IconExternalLink, IconLogout, IconMenu, IconClose } from './icons';
import { ADMIN_NAV_SECTIONS, BROTHER_NAV_SECTIONS } from './navConfig';

export type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

// Picks the single most specific matching nav item (longest href match),
// so e.g. "/brother/products/add" activates "Add Product" and not also
// the broader "My Products" entry it happens to be nested under.
function findActiveHref(pathname: string, sections: NavSection[]): string | null {
  let best: string | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (matches && (best === null || item.href.length > best.length)) {
        best = item.href;
      }
    }
  }
  return best;
}

export default function DashboardShell({
  title,
  userName,
  role,
  logoutHref,
  children,
}: {
  title: string;
  userName: string;
  role: 'admin' | 'brother';
  logoutHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const sections = role === 'admin' ? ADMIN_NAV_SECTIONS : BROTHER_NAV_SECTIONS;
  const activeHref = findActiveHref(pathname, sections);

  // Close the slide-out menu automatically on navigation, and never leave
  // it open (with its overlay) across a route change.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(logoutHref, { method: 'POST' });
    } finally {
      router.push(logoutHref.startsWith('/api/admin') ? '/admin/login' : '/brother/login');
      router.refresh();
    }
  }

  const navContent = (
    <>
      <nav className="dash-nav" aria-label="Dashboard">
        {sections.map((section, i) => (
          <div className="dash-nav-section" key={section.title ?? i}>
            {section.title && <p className="dash-nav-section-title">{section.title}</p>}
            {section.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`dash-nav-item${item.href === activeHref ? ' dash-nav-item-active' : ''}`}
                aria-current={item.href === activeHref ? 'page' : undefined}
              >
                <item.icon className="dash-nav-icon" />
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className="dash-sidebar-footer">
        <a href="/" className="dash-nav-item">
          <IconExternalLink className="dash-nav-icon" />
          View Website
        </a>
        <button type="button" className="dash-nav-item dash-nav-logout" onClick={handleLogout} disabled={loggingOut}>
          <IconLogout className="dash-nav-icon" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <button
            type="button"
            className="dash-hamburger"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <IconMenu />
          </button>
          <span className="dash-topbar-title">{title}</span>
        </div>
        <span className="dash-topbar-user">{userName}</span>
      </header>

      <div className="dash-body">
        <aside className="dash-sidebar">{navContent}</aside>

        {mobileNavOpen && (
          <div className="dash-mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
        )}
        <aside className={`dash-mobile-sidebar${mobileNavOpen ? ' dash-mobile-sidebar-open' : ''}`}>
          <div className="dash-mobile-sidebar-header">
            <span className="dash-topbar-title">{title}</span>
            <button
              type="button"
              className="dash-hamburger"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            >
              <IconClose />
            </button>
          </div>
          {navContent}
        </aside>

        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}
