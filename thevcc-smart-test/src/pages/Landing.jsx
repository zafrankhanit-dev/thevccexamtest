import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-3xl text-center">
          <div className="flex justify-center mb-5">
            <Logo size="xl" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase mb-2">
            VCC Digital Examination Portal
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-950">TheVCC Smart Test</h1>
          <p className="mt-1.5 text-ink-500 text-sm">Online Examination &amp; Student Performance System</p>

          <div className="mt-10 grid sm:grid-cols-2 gap-5 text-left">
            <Link
              to="/login"
              className="group card p-6 hover:border-brand-300 hover:shadow-popover transition-all duration-200"
            >
              <div className="h-11 w-11 rounded-xl2 bg-brand-50 text-brand-700 flex items-center justify-center">
                <GraduationCap size={22} />
              </div>
              <p className="font-semibold text-ink-900 mt-4">Student Portal</p>
              <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">
                Access your assigned tests, attempt examinations, and track your academic performance.
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                Continue as Student
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/admin/login"
              className="group card p-6 hover:border-brand-300 hover:shadow-popover transition-all duration-200"
            >
              <div className="h-11 w-11 rounded-xl2 bg-ink-100 text-ink-700 flex items-center justify-center">
                <LayoutDashboard size={22} />
              </div>
              <p className="font-semibold text-ink-900 mt-4">Admin Portal</p>
              <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">
                Manage examinations, students, questions, results, and performance.
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                Continue as Admin
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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
