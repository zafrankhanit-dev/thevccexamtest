import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl font-display font-bold text-brand-700">404</p>
        <p className="mt-2 text-ink-600">Page not found.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  );
}
