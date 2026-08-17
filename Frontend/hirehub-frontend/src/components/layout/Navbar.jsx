import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

/**
 * Navbar — top bar with branding, user info, and mobile menu toggle.
 */
export default function Navbar({ onToggleSidebar }) {
  const { user, role, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleLabels = {
    jobseeker: 'Job Seeker',
    employer: 'Employer',
    admin: 'Administrator',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center shadow-xs">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          Hire<span className="text-accent-600">Hub</span>
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Role badge */}
      <span className="hidden sm:inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">
        {roleLabels[role] || role}
      </span>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
            {user?.name || user?.email || 'User'}
          </span>
          <svg className="w-4 h-4 text-slate-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-modal z-20 py-2 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
