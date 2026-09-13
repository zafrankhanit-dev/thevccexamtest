import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const dims = {
    sm: 'h-16 w-16',
    md: 'h-32 w-32',
    lg: 'h-40 w-40',
  }[size];

  return (
    <img
      src="logo.png"
      alt="The Vision Coaching Centre"
      className={`${dims} object-contain ${className}`}
    />
  );
}
