import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { signOut } from '../lib/auth';

export default function AccountLocked() {
  const navigate = useNavigate();

  const handleBack = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center card p-8">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-2xl mb-4">
          🔒
        </div>
        <h1 className="text-lg font-semibold text-ink-950">Account Locked</h1>
        <p className="mt-2 text-sm text-ink-600 leading-relaxed">
          Your account is currently locked. Please contact The Vision Coaching Centre administrator.
        </p>
        <button className="btn-secondary w-full mt-6" onClick={handleBack}>
          Back to login
        </button>
      </div>
    </div>
  );
}
