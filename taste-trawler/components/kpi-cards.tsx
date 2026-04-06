import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  revenue30: number;
  profit30: number;
  profitKnown30: number;
  itemsSold30: number;
  avgDaysToSell: number;
  revenueAll: number;
  profitAll: number;
  profitKnownAll: number;
  itemsSoldAll: number;
  activeListings: number;
  staleListings: number;
}

function fmt(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string | null;
  accent?: 'green' | 'muted';
}) {
  return (
    <Card className="group rounded-[var(--radius)] border border-border bg-card transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p
          className={`mt-1 font-mono text-xl font-semibold [font-feature-settings:'tnum'] ${
            accent === 'green' ? 'text-emerald-500' : ''
          }`}
        >
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function KpiCards({ stats }: { stats: Stats }) {
  const profitCaveat30 =
    stats.itemsSold30 > 0 && stats.profitKnown30 < stats.itemsSold30
      ? `buy price known for ${stats.profitKnown30}/${stats.itemsSold30}`
      : null;

  const profitCaveatAll =
    stats.itemsSoldAll > 0 && stats.profitKnownAll < stats.itemsSoldAll
      ? `buy price known for ${stats.profitKnownAll}/${stats.itemsSoldAll}`
      : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Last 30 days</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Revenue"
            value={fmt(stats.revenue30)}
            sub={`${stats.itemsSold30} items sold`}
          />
          <KpiCard
            label="Profit"
            value={stats.profitKnown30 > 0 ? fmt(stats.profit30) : '—'}
            sub={profitCaveat30 ?? (stats.itemsSold30 === 0 ? 'no sales yet' : 'all buy prices missing')}
            accent={stats.profit30 > 0 ? 'green' : undefined}
          />
          <KpiCard
            label="Avg days to sell"
            value={stats.itemsSold30 > 0 ? `${stats.avgDaysToSell}d` : '—'}
          />
          <KpiCard
            label="Active listings"
            value={String(stats.activeListings)}
            sub={stats.staleListings > 0 ? `${stats.staleListings} stale (14d+)` : null}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">All time</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Total revenue"
            value={fmt(stats.revenueAll)}
            sub={`${stats.itemsSoldAll} items sold`}
          />
          <KpiCard
            label="Total profit"
            value={stats.profitKnownAll > 0 ? fmt(stats.profitAll) : '—'}
            sub={profitCaveatAll ?? (stats.itemsSoldAll === 0 ? 'no sales yet' : 'all buy prices missing')}
            accent={stats.profitAll > 0 ? 'green' : undefined}
          />
          <KpiCard
            label="Avg margin"
            value={
              stats.profitKnownAll > 0 && stats.revenueAll > 0
                ? `${Math.round((stats.profitAll / stats.revenueAll) * 100)}%`
                : '—'
            }
            sub={profitCaveatAll ? 'on items with buy price' : null}
          />
        </div>
      </div>
    </div>
  );
}
