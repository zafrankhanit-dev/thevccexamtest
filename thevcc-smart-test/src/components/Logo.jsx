import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const dims = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-28 w-28',
  }[size];

  return (
    <img
      src="logo.png"
      alt="The Vision Coaching Centre"
      className={`${dims} object-contain ${className}`}
    />
  );
}
