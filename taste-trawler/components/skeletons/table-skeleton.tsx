import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton matching the shape of the inventory table: a header row plus
 * N content rows. Rows mirror the real column widths so the page
 * doesn't jump on data arrival.
 */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading inventory" className="w-full">
      <div className="mb-2 flex items-center gap-4 border-b border-border pb-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
