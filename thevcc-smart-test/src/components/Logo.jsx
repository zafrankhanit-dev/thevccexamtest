import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const dims = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }[size];

  return (
    <img
      src="/final logo 02.png"
      alt="The Vision Coaching Centre"
      className={`${dims} object-contain ${className}`}
    />
  );
}
