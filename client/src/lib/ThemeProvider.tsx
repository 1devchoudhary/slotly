import React, { useCallback, useEffect, useState } from 'react';
import { applyTheme, THEME_KEY, ThemeContext, type Theme } from './theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The boot script in index.html already painted the correct theme; read it
  // back rather than recomputing, so the first render matches the DOM exactly.
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;

    // Crossfade the swap, then drop the class so it can't slow normal hovers.
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 340);

    applyTheme(next);
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* preference just won't persist */
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme]
  );

  // Follow the OS while the visitor hasn't picked a side themselves.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch {
        /* ignore */
      }
      if (stored === 'light' || stored === 'dark') return;
      const next: Theme = e.matches ? 'light' : 'dark';
      applyTheme(next);
      setThemeState(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
