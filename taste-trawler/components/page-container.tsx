import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Shared page container. Every page sits inside this so side padding and
 * max-width are consistent across routes. Do not use `max-w-screen-xl`
 * ad-hoc anymore — prefer this.
 */
export function PageContainer({
  children,
  className,
}: PageContainerProps) {
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
}: PageHeaderProps) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-[var(--radius-2xl)] border border-primary/20 bg-card/70 p-5 shadow-[var(--kitsch-shadow)] backdrop-blur md:mb-8 md:p-7">
      <div className="leopard-panel absolute inset-y-0 right-0 hidden w-44 opacity-35 md:block" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-1 gold-gloss" aria-hidden />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker mb-2">Taste Trawler HQ</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase leading-tight tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-prose text-sm font-medium text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
