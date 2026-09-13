import React from 'react';

/**
 * Logo placeholder.
 * To replace with the real TheVCC logo:
 *   1. Drop your logo file into /public, e.g. /public/logo.png
 *   2. Replace the contents of this component with:
 *        <img src="/logo.png" alt="The Vision Coaching Centre" className={className} />
 * This is the ONLY place the logo needs to change — Login, Admin header,
 * and Student header all render through this component.
 */
export default function Logo({ size = 'md', className = '' }) {
  const dims = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
  }[size];

  return (
    <div
      className={`${dims} shrink-0 rounded-xl2 bg-brand-700 text-white flex items-center justify-center font-display font-bold shadow-sm ${className}`}
      aria-label="The Vision Coaching Centre logo placeholder"
      title="Replace in src/components/Logo.jsx"
    >
      VCC
    </div>
  );
}
