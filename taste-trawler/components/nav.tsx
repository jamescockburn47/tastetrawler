'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/workbench', label: 'Workbench' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[var(--container-max)] items-center justify-between gap-4 px-[var(--container-pad-sm)] md:h-16 md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)]">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-base tracking-tight text-foreground md:text-lg"
          >
            Taste Trawler
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
                      'relative inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-primary"
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
