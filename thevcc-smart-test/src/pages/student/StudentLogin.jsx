import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <h1 className="mt-4 text-xl font-bold text-center">TheVCC Smart Test</h1>
          <p className="text-sm text-ink-500 text-center mt-1">Student Login</p>
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
                className="input pr-16"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500 hover:text-brand-700"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : 'Login'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-400 mt-6">
          <Link to="/admin/login" className="hover:text-brand-700">Admin login</Link>
          {' · '}
          <Link to="/" className="hover:text-brand-700">Back home</Link>
        </p>
      </div>
    </div>
  );
}
