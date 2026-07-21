import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-medium',
        'transition-all duration-300 ease-out select-none',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        {
          // Gradient fill + brand glow that intensifies on hover
          'bg-gradient-to-r from-brand-600 via-brand-500 to-plum-500 text-white shadow-[0_6px_24px_-8px_rgba(99,102,241,0.75)] hover:shadow-[0_10px_38px_-8px_rgba(139,92,246,0.9)] hover:brightness-110':
            variant === 'primary',
          'glass text-text-main hover:border-brand-400/45 hover:bg-overlay-hover':
            variant === 'secondary',
          'border border-card-border bg-transparent text-text-main hover:border-brand-400/60 hover:bg-brand-500/10':
            variant === 'outline',
          'text-text-muted hover:bg-overlay-hover hover:text-text-main': variant === 'ghost',
          'bg-status-danger/15 text-status-danger ring-1 ring-status-danger/30 hover:bg-status-danger/25':
            variant === 'danger',
        },
        {
          'h-9 px-3.5 text-sm': size === 'sm',
          'h-11 px-5 text-[0.95rem]': size === 'md',
          'h-13 px-7 text-base': size === 'lg',
          'h-14 px-9 text-lg': size === 'xl',
          'h-11 w-11 p-0': size === 'icon',
        },
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {/* Sweeping highlight on hover */}
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full skew-x-[-18deg] bg-white/25 transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
      )}

      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
          />
        </svg>
      )}

      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
