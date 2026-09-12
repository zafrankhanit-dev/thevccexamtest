import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../../components/Logo';
import ConfirmDialog from '../../components/ConfirmDialog';
import { signOut } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/student', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/student/tests', label: 'Available Tests', icon: '📝' },
];

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { profile, studentRow } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await signOut();
    toast.success('Logged out.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-ink-100 bg-white">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-ink-100">
          <Logo size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">TheVCC Smart Test</p>
            <p className="text-xs text-ink-400">Student Portal</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-ink-100">
          <button onClick={() => setConfirmLogout(true)} className="btn-ghost w-full justify-start">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-ink-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-sm font-semibold">TheVCC Smart Test</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-ink-600" aria-label="Open menu">
          ☰
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4 flex flex-col">
            <button className="self-end text-ink-400 mb-4" onClick={() => setMobileOpen(false)}>✕</button>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => { setMobileOpen(false); setConfirmLogout(true); }}
              className="btn-ghost w-full justify-start mt-auto"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-ink-100 bg-white">
          <div>
            <p className="text-sm text-ink-400">Welcome back</p>
            <p className="font-semibold text-ink-900">{profile?.full_name || 'Student'}</p>
          </div>
          {studentRow && (
            <div className="text-right text-sm text-ink-500">
              <p>{studentRow.student_id}</p>
              {(studentRow.class || studentRow.section) && (
                <p className="text-xs text-ink-400">
                  {studentRow.class} {studentRow.section ? `· ${studentRow.section}` : ''}
                </p>
              )}
            </div>
          )}
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need to sign in again to access your tests."
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
