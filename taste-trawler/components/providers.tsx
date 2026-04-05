'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

/**
 * Client-side theme provider. Themes are `malibu` and `leopard` — there
 * is no `system` mode because the themes aren't light/dark variants of
 * a single aesthetic.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="malibu"
      themes={['malibu', 'leopard']}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors closeButton position="top-center" />
    </ThemeProvider>
  );
}
