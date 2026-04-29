'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Theme toggle cycling between 'malibu' and 'leopard'. Uses next-themes
 * so the class on <html> is managed consistently with SSR and no FOUC.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Switch theme"
        className="h-8 w-24 rounded-full border border-border bg-muted/30"
      />
    );
  }

  const isMalibu = theme === 'malibu';
  const label = isMalibu ? 'Leopard' : 'Malibu';

  return (
    <button
      type="button"
      onClick={() => setTheme(isMalibu ? 'leopard' : 'malibu')}
      aria-label={`Switch to ${label} theme`}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span aria-hidden>{isMalibu ? '🐆' : '✨'}</span>
      {label}
    </button>
  );
}
