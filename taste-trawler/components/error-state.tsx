'use client';

import { cn } from '@/lib/utils';

/**
 * Themed error state for use inside route segments and components.
 * Never renders a red banner — the destructive token carries the weight.
 */
export function ErrorState({
  title = 'Something tripped up.',
  description,
  retry,
  className,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 px-6 py-6',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-1 inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Small helper: render this from Next.js route-segment `error.tsx` files.
 */
export function RouteErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This page didn't load."
      description={
        error.digest
          ? `Reference: ${error.digest}. Ask James to check the Vercel logs.`
          : error.message
      }
      retry={reset}
    />
  );
}
