import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  revenue: number;
  profit: number;
  margin: number;
  itemsSold: number;
  avgDaysToSell: number;
  activeListings: number;
  staleListings: number;
  bestFlip: { title: string; margin: number; marginPct: number } | null;
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function KpiCards({ stats }: { stats: Stats }) {
  const kpis = [
    { label: 'Revenue', value: formatPence(stats.revenue), sub: `${stats.margin}% margin` },
    { label: 'Profit', value: formatPence(stats.profit), sub: null },
    { label: 'Items Sold', value: String(stats.itemsSold), sub: `Avg ${stats.avgDaysToSell}d to sell` },
    { label: 'Active', value: String(stats.activeListings), sub: stats.staleListings > 0 ? `${stats.staleListings} stale` : null },
    { label: 'Best Flip', value: stats.bestFlip ? formatPence(stats.bestFlip.margin) : '—', sub: stats.bestFlip ? `${stats.bestFlip.title} · ${stats.bestFlip.marginPct}%` : null },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map(({ label, value, sub }) => (
        <Card
          key={label}
          className="group rounded-[var(--radius)] border border-border bg-card transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold [font-feature-settings:'tnum']">{value}</p>
            {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
