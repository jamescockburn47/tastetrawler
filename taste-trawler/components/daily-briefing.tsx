import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BriefingStats {
  itemsSold30: number;
  profit30: number;
  profitKnown30: number;
  activeListings: number;
  staleListings: number;
}

function money(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function DailyBriefing({ stats }: { stats: BriefingStats }) {
  const profitLine = stats.profitKnown30
    ? `${money(stats.profit30)} profit logged.`
    : 'Profit is hiding because buy prices are missing.';

  const salesLine = stats.itemsSold30 > 0
    ? `${stats.itemsSold30} sold in 30 days. ${profitLine}`
    : 'No confirmed sales in the 30-day window. Calm, or suspiciously calm.';

  const staleLine = stats.staleListings > 0
    ? `${stats.staleListings} listing${stats.staleListings === 1 ? ' is' : 's are'} loitering past 14 days. Reprice, relist, or give them a stern talking-to.`
    : 'Nothing stale. The rails are behaving for once.';

  const stockLine = stats.activeListings > 0
    ? `${stats.activeListings} active listing${stats.activeListings === 1 ? '' : 's'} doing their little pageant online.`
    : 'No active listings. The shop floor is giving tumbleweed.';

  return (
    <Card className="relative overflow-hidden border-primary/25 bg-primary/10">
      <div className="leopard-panel absolute inset-y-0 right-0 w-28 opacity-25" aria-hidden />
      <CardHeader className="relative pb-2">
        <p className="section-kicker">Morning sass report</p>
        <CardTitle className="font-[family-name:var(--font-display)] text-2xl uppercase">
          Today&apos;s Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="relative grid gap-3 text-sm font-medium text-muted-foreground md:grid-cols-3">
        {[salesLine, stockLine, staleLine].map((line) => (
          <p key={line} className="rounded-[var(--radius-lg)] border border-primary/15 bg-card/65 p-3">
            {line}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
