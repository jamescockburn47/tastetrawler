import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for the 4-up KPI row on the dashboard. Matches the final card
 * layout so the dashboard doesn't reshuffle when real numbers arrive.
 */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius)] border border-border bg-card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
