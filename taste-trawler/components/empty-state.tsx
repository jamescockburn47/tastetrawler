import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Themed empty state. In phase 1 the illustration slot is optional and
 * accepts any ReactNode; phase 2/3 will ship theme-specific SVG
 * illustrations that slot in here.
 */
export function EmptyState({
  title,
  description,
  illustration,
  action,
  className,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-border bg-muted/30 px-6 py-12 text-center',
        className,
      )}
    >
      {illustration && (
        <div className="flex h-16 w-16 items-center justify-center text-4xl text-muted-foreground">
          {illustration}
        </div>
      )}
      <div className="max-w-md space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
