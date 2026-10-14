'use client';

import * as React from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'keybox-hub-theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  mounted: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  mounted: false
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>('dark');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = stored === 'light' ? 'light' : 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    setMounted(true);
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, toggle, mounted }),
    [theme, toggle, mounted]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
