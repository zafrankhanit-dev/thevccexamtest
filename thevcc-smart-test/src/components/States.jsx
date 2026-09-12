import React from 'react';

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function PageLoading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-ink-500">
      <Spinner className="h-8 w-8 text-brand-700" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-500 max-w-sm">{description}</p>}
      {onRetry && (
        <button className="btn-secondary mt-5" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
