import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, GraduationCap, ShieldCheck, BookOpen, FileText,
  CheckCircle2, BarChart3, CalendarDays, Settings, LogOut, Menu, X,
} from 'lucide-react';
import Logo from '../../components/Logo';
import ConfirmDialog from '../../components/ConfirmDialog';
import { signOut } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/access', label: 'User Access', icon: ShieldCheck },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/admin/tests', label: 'Tests', icon: FileText },
  { to: '/admin/results', label: 'Results', icon: CheckCircle2 },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/reports', label: 'Reports', icon: CalendarDays },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await signOut();
    toast.success('Logged out.');
    navigate('/admin/login', { replace: true });
  };

  const NavList = ({ onNavigate }) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
              }`
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 flex">
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-ink-100 dark:border-ink-800">
          <Logo size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">TheVCC Smart Test</p>
            <p className="text-xs text-ink-400">Admin Panel</p>
          </div>
        </div>
        <NavList />
        <div className="px-3 py-4 border-t border-ink-100 dark:border-ink-800">
          <button onClick={() => setConfirmLogout(true)} className="btn-ghost w-full justify-start gap-3">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(true)} className="p-2 text-ink-600 dark:text-ink-300" aria-label="Open menu"><Menu size={22}/></button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-ink-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-ink-100 dark:border-ink-800">
              <span className="text-sm font-semibold">Menu</span>
              <button className="text-ink-400" onClick={() => setMobileOpen(false)}><X size={20}/></button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="px-3 py-4 border-t border-ink-100 dark:border-ink-800">
              <button
                onClick={() => { setMobileOpen(false); setConfirmLogout(true); }}
                className="btn-ghost w-full justify-start gap-3"
              >
                <LogOut size={18}/> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
          <ThemeToggle />
          <div className="text-right text-sm">
            <p className="font-semibold text-ink-900">{profile?.full_name || 'Administrator'}</p>
            <p className="text-xs text-ink-400">@{profile?.username}</p>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
