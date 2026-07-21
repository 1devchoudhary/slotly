import React from 'react';
import { cn } from '../../lib/utils';

type Status = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusPillProps {
  status: Status;
  children: React.ReactNode;
  className?: string;
  /** Adds a soft pulsing halo on the dot — good for "live" states. */
  pulse?: boolean;
}

const TONE: Record<Status, { wrap: string; dot: string }> = {
  success: {
    wrap: 'bg-status-success/10 text-status-success ring-status-success/25',
    dot: 'bg-status-success',
  },
  warning: {
    wrap: 'bg-status-warning/10 text-status-warning ring-status-warning/25',
    dot: 'bg-status-warning',
  },
  danger: {
    wrap: 'bg-status-danger/10 text-status-danger ring-status-danger/25',
    dot: 'bg-status-danger',
  },
  info: {
    wrap: 'bg-status-info/10 text-status-info ring-status-info/25',
    dot: 'bg-status-info',
  },
  neutral: {
    wrap: 'bg-overlay-3 text-text-muted ring-hairline',
    dot: 'bg-text-muted',
  },
};

export function StatusPill({ status, children, className, pulse = false }: StatusPillProps) {
  const tone = TONE[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset backdrop-blur-sm',
        tone.wrap,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn('animate-ping-ring absolute inset-0 rounded-full', tone.dot)}
            aria-hidden="true"
          />
        )}
        <span className={cn('relative h-1.5 w-1.5 rounded-full', tone.dot)} />
      </span>
      {children}
    </span>
  );
}
