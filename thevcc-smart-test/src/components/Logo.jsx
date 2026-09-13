import React from 'react';

/**
 * TheVCC logo. Reads /public/logo.png — the ONLY place the logo needs to
 * change is here; Login, Admin header, and Student header all render
 * through this component.
 */
export default function Logo({ size = 'md', className = '' }) {
  const dims = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28',
  }[size];

  return (
    <img
      src="/logo.png"
      alt="The Vision Coaching Centre"
      className={`${dims} object-contain shrink-0 ${className}`}
    />
  );
}
