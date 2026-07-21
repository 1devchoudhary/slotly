import { cn } from '../../lib/utils';

/**
 * Ambient page backdrop: three slow-drifting colour blooms over a masked grid.
 * Fixed + pointer-events-none, so it never interferes with the layout above it.
 *
 * The blooms are deliberately much weaker on light ground — saturated colour
 * that reads as "lit from behind" on ink just reads as "muddy" on off-white,
 * so `--aurora-opacity` scales the whole stack per theme.
 */
export function Aurora({
  className,
  variant = 'full',
}: {
  className?: string;
  variant?: 'full' | 'subtle';
}) {
  const strength = variant === 'full' ? 1 : 0.45;

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-surface" />

      {/* Grid, faded toward the bottom */}
      <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />

      {/* Drifting blooms */}
      <div
        className="animate-drift absolute -top-40 -left-32 h-[38rem] w-[38rem] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #4f46e5 0%, transparent 68%)',
          opacity: `calc(var(--aurora-opacity) * ${0.4 * strength})`,
        }}
      />
      <div
        className="animate-drift-slow absolute -top-24 right-[-10rem] h-[34rem] w-[34rem] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, transparent 68%)',
          opacity: `calc(var(--aurora-opacity) * ${0.35 * strength})`,
        }}
      />
      <div
        className="animate-drift absolute bottom-[-14rem] left-1/3 h-[32rem] w-[32rem] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          opacity: `calc(var(--aurora-opacity) * ${0.25 * strength})`,
          animationDelay: '-8s',
        }}
      />

      {/* Vignette keeps text legible over the blooms */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, var(--vignette) 100%)',
        }}
      />
    </div>
  );
}
