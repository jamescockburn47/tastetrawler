import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Nav } from '@/components/nav';
import { Providers } from '@/components/providers';
import { readAllThemes } from '@/lib/theme';
import { allThemeCssBlocks } from '@/lib/theme-css';
import { malibuDisplay, leopardDisplay } from './fonts';
import './globals.css';

export const metadata = {
  title: 'Taste Trawler',
  description: 'AI-powered resale assistant',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // DIAGNOSTIC: log env presence + catch any theme-read failure so we can
  // see WHY the preview deploy is 500ing. Remove once root cause confirmed.
  console.log('[layout] env presence:', {
    DATABASE_URL: !!process.env.DATABASE_URL,
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    AI_GATEWAY_API_KEY: !!process.env.AI_GATEWAY_API_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
  let cssOverrides = '';
  try {
    const themes = await readAllThemes();
    cssOverrides = allThemeCssBlocks(themes);
  } catch (err) {
    console.error('[layout] readAllThemes threw:', err);
    // Continue rendering with empty overrides — theme scopes in globals.css
    // still apply their base palettes.
  }

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Dial-driven CSS variable overrides, computed at request time */}
          <style dangerouslySetInnerHTML={{ __html: cssOverrides }} />
        </head>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} ${malibuDisplay.variable} ${leopardDisplay.variable} font-sans antialiased bg-background text-foreground`}
        >
          <Providers>
            <Nav />
            <main className="mx-auto max-w-[var(--container-max)] px-[var(--container-pad-sm)] md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)] py-6">
              {children}
            </main>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
