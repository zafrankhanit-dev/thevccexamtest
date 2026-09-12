import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold">TheVCC Smart Test</h1>
          <p className="mt-1.5 text-ink-500 text-sm">Online Examination &amp; Student Performance System</p>

          <div className="mt-10 grid gap-4">
            <Link to="/login" className="card p-5 text-left hover:border-brand-300 transition group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-900">Student Login</p>
                  <p className="text-sm text-ink-500 mt-0.5">Take your assigned tests</p>
                </div>
                <span className="text-brand-700 group-hover:translate-x-0.5 transition">›</span>
              </div>
            </Link>
            <Link to="/admin/login" className="card p-5 text-left hover:border-brand-300 transition group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-900">Admin Login</p>
                  <p className="text-sm text-ink-500 mt-0.5">Manage tests, students &amp; results</p>
                </div>
                <span className="text-brand-700 group-hover:translate-x-0.5 transition">›</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <footer className="text-center text-xs text-ink-400 pb-6">
        The Vision Coaching Centre — TheVCC Smart Test
      </footer>
    </div>
  );
}
