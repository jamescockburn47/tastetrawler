'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/workbench', label: 'Workbench' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-mono text-sm font-semibold tracking-tight">
            Taste Trawler
          </Link>
          <div className="flex gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  pathname === href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <UserButton />
      </div>
    </nav>
  );
}
