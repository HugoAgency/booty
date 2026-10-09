'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AnimatedLogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'light' | 'dark';
}

export default function AnimatedLogo({
  className = '',
  width = 210,
  height = 58,
  variant = 'light',
}: AnimatedLogoProps) {
  return (
    <Link
      href="/"
      className={`group relative inline-flex items-center gap-2 overflow-hidden select-none py-1 transition-transform duration-300 hover:scale-[1.03] ${className}`}
    >
      {/* Logo container with gentle float animation */}
      <div className="relative animate-float" style={{ width, height }}>
        <Image
          src="/images/logo-tight.png"
          alt="THE BOOTY REPUBLIC"
          fill
          priority
          className="object-contain filter drop-shadow-[0_2px_8px_rgba(255,141,161,0.25)] transition-all duration-300 group-hover:brightness-105"
        />

        {/* Shimmer light reflection effect */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
      </div>

      {/* Subtle glowing ambient aura on hover */}
      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-300/20 via-rose-300/20 to-peach-200/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  );
}
