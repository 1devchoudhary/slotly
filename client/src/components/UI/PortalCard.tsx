import React from 'react';
import { cn } from '../../lib/utils';

interface PortalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Lift + shadow on hover. */
  hover?: boolean;
  /** Animated gradient hairline border. */
  gradientBorder?: boolean;
  /** Soft brand bloom around the card. */
  glow?: boolean;
}

export function PortalCard({
  className,
  children,
  hover = false,
  gradientBorder = false,
  glow = false,
  ...props
}: PortalCardProps) {
  return (
    <div
      className={cn(
        'glass relative rounded-2xl shadow-card',
        hover && 'lift hover:border-brand-400/35',
        gradientBorder && 'border-gradient !border-transparent',
        glow && 'glow-brand',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
