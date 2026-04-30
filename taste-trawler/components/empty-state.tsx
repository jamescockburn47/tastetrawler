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
        'kitsch-card-quiet flex flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      {illustration && (
        <div className="leopard-panel flex h-16 w-16 items-center justify-center rounded-full text-4xl text-primary-foreground shadow-md">
          {illustration}
        </div>
      )}
      <div className="max-w-md space-y-1">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold uppercase text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
