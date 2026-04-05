import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared page container. Every page sits inside this so side padding and
 * max-width are consistent across routes. Do not use `max-w-screen-xl`
 * ad-hoc anymore — prefer this.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[var(--container-max)]',
        'px-[var(--container-pad-sm)] md:px-[var(--container-pad-md)] lg:px-[var(--container-pad-lg)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section header used above each block of content. Title uses the body
 * font (NOT the display font) — display font is reserved for theatre
 * surfaces only, per the design spec.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
