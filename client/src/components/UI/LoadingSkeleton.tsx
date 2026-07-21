import { cn } from '../../lib/utils';

export function LoadingSkeleton({
  className,
  type = 'rect',
  delay = 0,
}: {
  className?: string;
  type?: 'rect' | 'circle';
  delay?: number;
}) {
  return (
    <div
      className={cn('skeleton', type === 'circle' ? 'rounded-full' : 'rounded-xl', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      aria-hidden="true"
    />
  );
}
