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
  const themes = await readAllThemes();
  const cssOverrides = allThemeCssBlocks(themes);

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
