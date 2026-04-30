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
        type="button"
        aria-label="Switch theme"
        disabled
        className="h-8 w-24 rounded-full border border-border bg-muted/30"
      />
    );
  }

  const isMalibu = theme === 'malibu';
  const nextTheme = isMalibu ? 'leopard' : 'malibu';
  const label = isMalibu ? 'Leopard' : 'Pink';

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${label} theme`}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-primary/25 bg-card/70 px-3 text-xs font-bold text-foreground/80 shadow-sm backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span
        aria-hidden
        className={isMalibu ? 'leopard-panel h-4 w-4 rounded-full' : 'gold-gloss h-4 w-4 rounded-full'}
      />
      {label}
    </button>
  );
}
