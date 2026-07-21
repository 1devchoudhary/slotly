import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

/** Sun/moon crossfade — the two icons swap on a rotate so nothing pops. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'group relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl',
        'border border-hairline bg-overlay-1 text-text-muted',
        'transition-all duration-300 hover:border-brand-400/45 hover:bg-overlay-hover hover:text-text-main active:scale-95',
        className
      )}
    >
      <span
        className={cn(
          'absolute transition-all duration-500 ease-out',
          isDark ? 'scale-50 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        )}
      >
        <Sun size={17} />
      </span>
      <span
        className={cn(
          'absolute transition-all duration-500 ease-out',
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-90 opacity-0'
        )}
      >
        <Moon size={17} />
      </span>
    </button>
  );
}
