import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for gallery-style grids. Used by the workbench browse view
 * and (in phase 5) the new inventory gallery.
 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading items"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-[var(--radius)]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
