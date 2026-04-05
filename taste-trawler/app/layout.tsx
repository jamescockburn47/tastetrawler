import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { malibuDisplay, leopardDisplay } from './fonts';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Nav } from '@/components/nav';
import './globals.css';

export const metadata = {
  title: 'Taste Trawler',
  description: 'AI-powered resale assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className={`${GeistSans.variable} ${GeistMono.variable} ${malibuDisplay.variable} ${leopardDisplay.variable} font-sans antialiased bg-background text-foreground`}>
          <Nav />
          <main className="mx-auto max-w-screen-xl px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
