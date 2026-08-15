import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/* ── Icon components (inline SVG for zero-dep) ───────────── */
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  resume: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  applications: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  recommendations: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  company: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  postJob: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  manageJobs: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  flagged: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  lock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
};

/* ── Navigation definitions per role ─────────────────────── */
const navConfig = {
  jobseeker: [
    { to: '/jobseeker/dashboard', icon: icons.dashboard, label: 'Dashboard' },
    { to: '/jobseeker/profile', icon: icons.profile, label: 'My Profile' },
    { to: '/jobseeker/resume', icon: icons.resume, label: 'Resume' },
    { to: '/jobseeker/jobs', icon: icons.search, label: 'Search Jobs' },
    { to: '/jobseeker/applications', icon: icons.applications, label: 'My Applications' },
    { to: '/jobseeker/recommendations', icon: icons.recommendations, label: 'AI Recommendations' },
  ],
  employer: [
    { to: '/employer/dashboard', icon: icons.dashboard, label: 'Dashboard' },
    { to: '/employer/company', icon: icons.company, label: 'Company Profile' },
    { to: '/employer/post-job', icon: icons.postJob, label: 'Post a Job' },
    { to: '/employer/jobs', icon: icons.manageJobs, label: 'Manage Jobs' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: icons.dashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: icons.users, label: 'Users' },
    { to: '/admin/flagged', icon: icons.flagged, label: 'Flagged Postings' },
    { to: '/admin/analytics', icon: icons.analytics, label: 'Analytics' },
  ],
};

/**
 * Sidebar — role-aware navigation panel.
 *
 * Props:
 *   open    – boolean for mobile drawer visibility
 *   onClose – callback to close drawer on mobile
 */
export default function Sidebar({ open, onClose }) {
  const role = useAuthStore((s) => s.role);
  const links = navConfig[role] || [];

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-accent-50 text-accent-700 shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
    }`;

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Navigation
      </p>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={linkClasses}
          onClick={onClose} // close drawer on mobile
          end={link.to.endsWith('dashboard')}
        >
          {link.icon}
          {link.label}
        </NavLink>
      ))}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <NavLink
          to="/change-password"
          className={linkClasses}
          onClick={onClose}
        >
          {icons.lock}
          Change Password
        </NavLink>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-[var(--spacing-sidebar)] md:fixed md:inset-y-0 md:top-16 bg-white border-r border-slate-200 z-20">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
          <aside className="absolute top-0 left-0 h-full w-72 bg-white shadow-modal animate-slide-in-left flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <span className="text-lg font-bold text-slate-800">
                Hire<span className="text-accent-600">Hub</span>
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
