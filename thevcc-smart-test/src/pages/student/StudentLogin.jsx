import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Logo from '../../components/Logo';
import { studentSignIn } from '../../lib/auth';
import { Spinner } from '../../components/States';

export default function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await studentSignIn(username, password);
      toast.success('Welcome back!');
      navigate('/student', { replace: true });
    } catch (err) {
      if (err.code === 'ACCOUNT_LOCKED') {
        navigate('/account-locked', { replace: true });
      } else {
        toast.error(err.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <div className="flex items-center gap-2 mt-4">
            <GraduationCap size={18} className="text-brand-700" />
            <h1 className="text-xl font-bold text-center">Student Login</h1>
          </div>
          <p className="text-sm text-ink-500 text-center mt-1">
            Sign in to access your tests and performance dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="username">Username / Student ID</label>
            <input
              id="username"
              className="input"
              placeholder="e.g. VCC25"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="input pr-11"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-brand-700"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-400 mt-6">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-700">
            <ArrowLeft size={12} /> Back to Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
