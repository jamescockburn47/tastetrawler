'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sales', label: 'Sales' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/workbench', label: 'Workbench' },
  { href: '/how-to', label: 'How To' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-primary/20 bg-background/75 shadow-[0_10px_35px_oklch(0.18_0.06_35_/_10%)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[var(--container-max)] items-center justify-between gap-4 px-[var(--container-pad-sm)] md:h-16 md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)]">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-foreground"
          >
            <span className="leopard-panel hidden h-9 w-9 rounded-full border border-secondary/30 shadow-md sm:inline-block" aria-hidden />
            <span className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-display)] text-lg uppercase tracking-tight md:text-xl">
                Taste Trawler
              </span>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.28em] text-primary md:inline">
                resale, but make it dangerous
              </span>
            </span>
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      active
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
                    )}
                  >
                    {label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-4 -bottom-[9px] h-[3px] rounded-full gold-gloss"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
